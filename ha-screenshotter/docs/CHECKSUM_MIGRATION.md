# Checksum Migration Guide

## Overview

Starting with version 1.17.0, HA Screenshotter uses **pixel-based CRC32 checksums** instead of file-based checksums. This change eliminates false positives and improves battery life for e-ink devices.

## What Changed

### Before (v1.16.x and earlier)
- Checksum calculated over the entire PNG file
- PNG metadata and compression settings could cause checksum changes
- E-ink devices might download identical-looking screenshots unnecessarily

### After (v1.17.0+)
- Checksum calculated over raw pixel buffer + image dimensions
- Only actual pixel changes trigger checksum updates
- Eliminates false positives from PNG encoding variations
- Better battery life for e-ink devices

## Impact on Users

### For Most Users
**No action required!** The change is fully automatic and backward compatible:
- Checksum files (`.crc32`) use the same format and location
- Web server serves checksums at the same URLs
- E-ink device code continues to work without modification

### First Run After Upgrade
When you upgrade to v1.17.0+, the first screenshot batch will generate new checksums based on pixel data. Your e-ink device will see these as "changed" and download the images once. After that, checksums will be stable and more reliable.

### For Advanced Users
If you have custom scripts that compare checksums between runs:
- Old file-based checksums and new pixel-based checksums will differ
- This is expected and normal behavior
- New checksums are more reliable for detecting actual visual changes

## Benefits

1. **Improved reliability**: Checksums only change when pixels change
2. **Battery savings**: Eliminates unnecessary downloads for e-ink devices
3. **Better performance**: CRC32 lookup table precomputed at module load
4. **Backward compatible**: Same file format, same URLs, same workflow

## Technical Details

### Checksum Calculation
- **Input**: Raw pixel buffer (uncompressed RGBA or grayscale data)
- **Header**: 12 bytes containing width, height, and channel count
- **Algorithm**: CRC32 over concatenated header + pixel buffer
- **Output**: 8-character lowercase hexadecimal string (e.g., `28d8da06`)

### Why Pixel-Based?
PNG files can vary due to:
- Metadata (timestamps, software version, comments)
- Compression level settings
- Chunk ordering or optional chunks
- Encoder implementation differences

These variations don't affect the displayed image but cause file-based checksums to differ. Pixel-based checksums eliminate this problem by comparing only what matters: the actual pixels.

## Rollback

If you need to rollback for any reason:
1. Downgrade to v1.16.1 or earlier
2. Checksums will be regenerated using the old file-based method
3. Your e-ink devices will work normally after one "changed" detection

## Questions?

See [Troubleshooting](TROUBLESHOOTING.md) or open an issue on GitHub if you have concerns about the checksum change.
