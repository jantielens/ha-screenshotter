# Perfect for E-ink Displays

Optimized output for e-paper and low-color displays, tested with Inkplate and similar devices.

## How It Works
- Grayscale and bit depth reduction for e-ink
- Efficient processing for continuous operation
- Mobile layouts for better readability

## Usage Example
```yaml
grayscale: true
bit_depth: 1
```

## Typical Scenario: E-ink Dashboard with Home Assistant

1. **Create a dashboard in Home Assistant**
	 - Design a Lovelace dashboard with your desired widgets, graphs, and controls.

2. **HA Screenshotter add-on takes screenshots**
	 - The add-on automatically captures screenshots of your dashboard at a set interval (e.g., every 5 minutes).
	 - Screenshots are made available via the built-in web server (e.g., `http://your-home-assistant-ip:3000/screenshots/0.png`).

3. **E-ink display downloads and displays the screenshot**
	 - The e-ink device (often ESP-based) wakes up, downloads the latest screenshot from the add-on’s web server, displays it, and returns to deep sleep.

### Advantages
- **Minimal processing on the e-ink display:**
	- No need to run a browser or render HTML/CSS on the device.
	- No need to write or deploy complex C++ code for dashboard rendering.
- **Low power consumption:**
	- E-ink device can use deep sleep between updates, maximizing battery life.
	- Only wakes up briefly to download and display the image.
- **Flexible dashboard design:**
	- All dashboard logic and design is handled in Home Assistant.
	- Easily update the dashboard without touching the e-ink device firmware.

## Efficient Screenshot Change Detection with CRC32 Checksums

The add-on automatically generates CRC32 checksum files for each screenshot, enabling e-ink devices to efficiently detect when screenshots have changed without downloading the full image. This is especially important for battery-powered e-ink displays using deep sleep.

### How It Works

For each screenshot (e.g., `0.png`), the add-on generates a companion checksum file (e.g., `0.png.crc32`) containing an 8-character hexadecimal CRC32 hash of the processed screenshot. These checksum files are:

- **Tiny**: Only 8 bytes (8 hex characters) vs typical screenshot sizes of 50-500 KB
- **Fast to download**: Minimal bandwidth and latency
- **Reliable**: CRC32 provides sufficient collision resistance for change detection
- **Accessible via web server**: Same URL pattern as screenshots (e.g., `http://server:3000/screenshots/0.png.crc32`)

### E-ink Device Workflow

**Before (without checksums):**
1. Wake from deep sleep
2. Download full image (~50-500 KB)
3. Display image (or skip if unchanged)
4. Return to deep sleep

**After (with checksums):**
1. Wake from deep sleep
2. Download checksum file (~8 bytes) ⚡
3. Compare with stored checksum
4. **If unchanged**: Return to deep sleep immediately ✅ (saves battery!)
5. **If changed**: Download full image, display, update stored checksum, return to sleep

### ESP32/Arduino Example

Here's a complete example showing how to use checksums with minimal memory usage by storing as `uint32_t`:

```cpp
#include <Preferences.h>
#include <HTTPClient.h>

Preferences preferences;
HTTPClient http;

// Configuration
const char* checksumUrl = "http://ha-server:3000/screenshots/0.png.crc32";
const char* imageUrl = "http://ha-server:3000/screenshots/0.png";

void setup() {
  Serial.begin(115200);
  preferences.begin("eink-app", false);
  
  // Connect to WiFi...
  // (your WiFi connection code here)
  
  checkAndUpdateScreenshot();
  
  // Go to deep sleep
  esp_deep_sleep_start();
}

void checkAndUpdateScreenshot() {
  // Download tiny checksum file (only 8 bytes)
  http.begin(checksumUrl);
  int httpCode = http.GET();
  
  if (httpCode != HTTP_CODE_OK) {
    Serial.println("Failed to fetch checksum");
    http.end();
    return;
  }
  
  // Get checksum as hex string
  String checksumHex = http.getString();
  http.end();
  
  // Convert hex string to uint32_t (only 4 bytes in NVS!)
  uint32_t newChecksum = strtoul(checksumHex.c_str(), NULL, 16);
  
  // Retrieve stored checksum from NVS (only 4 bytes stored)
  uint32_t storedChecksum = preferences.getUInt("checksum", 0);
  
  Serial.printf("New checksum: %08x, Stored: %08x\n", newChecksum, storedChecksum);
  
  // Compare checksums
  if (newChecksum != storedChecksum) {
    Serial.println("Screenshot changed, downloading...");
    
    // Download and display the new screenshot
    downloadAndDisplayImage(imageUrl);
    
    // Update stored checksum (only 4 bytes)
    preferences.putUInt("checksum", newChecksum);
    Serial.println("Screenshot updated");
  } else {
    Serial.println("No change, skipping download");
  }
}

void downloadAndDisplayImage(const char* url) {
  // Your code to download image and display on e-ink
  // (implementation depends on your e-ink library)
}
```

### Benefits

- **Minimal storage**: CRC32 as `uint32_t` requires only 4 bytes in NVS
- **Fast comparison**: Simple integer comparison
- **Battery savings**: Skip downloading unchanged images (~50-500 KB saved per check)
- **Reduced latency**: Wake-check-sleep cycle is much faster when image hasn't changed
- **Network efficiency**: Minimal bandwidth usage for change detection

### Technical Details

- **Algorithm**: CRC32 (using Node.js built-in `zlib` module)
- **Format**: Plain text file with 8-character lowercase hexadecimal string
- **Checksum timing**: Generated after all image processing (rotation, grayscale, cropping, bit depth reduction)
- **URL pattern**: `http://server:port/screenshots/{index}.png.crc32`
- **Size**: 8 bytes total (8 ASCII hex characters)
- **Reliability**: More than sufficient collision resistance for screenshot change detection