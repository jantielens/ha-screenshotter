/**
 * Checksum utility for generating CRC32 checksums
 */

const fs = require('fs-extra');
const path = require('path');
const zlib = require('zlib');
const sharp = require('sharp');

// Precompute CRC32 lookup table at module load for better performance
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }
  return table;
})();

/**
 * Calculate CRC32 checksum manually (compatible with all Node.js versions)
 * @param {Buffer} buffer - Buffer to calculate CRC32 for
 * @returns {number} CRC32 checksum as unsigned 32-bit integer
 */
function calculateCRC32Manual(buffer) {
  // Calculate CRC32 using precomputed lookup table
  let crc = 0 ^ (-1);
  for (let i = 0; i < buffer.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ buffer[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

/**
 * Calculate CRC32 checksum over raw pixel buffer from a PNG image
 * This ensures the checksum only changes when actual pixels change,
 * not when PNG metadata or compression artifacts change.
 * @param {string} pngPath - Path to the PNG image file
 * @returns {Promise<string>} CRC32 checksum as 8-character hexadecimal string
 */
async function calculatePixelChecksum(pngPath) {
  try {
    // Load the PNG image with Sharp
    const image = sharp(pngPath);
    const metadata = await image.metadata();
    
    // Extract raw pixel buffer (uncompressed RGBA or grayscale data)
    const rawBuffer = await image.raw().toBuffer();
    
    // Create a header containing width, height, and channel count
    // This ensures the checksum is unique even if raw pixel data happens to match
    const header = Buffer.allocUnsafe(12);
    header.writeUInt32LE(metadata.width, 0);
    header.writeUInt32LE(metadata.height, 4);
    header.writeUInt32LE(metadata.channels, 8);
    
    // Concatenate header and raw pixel buffer
    const composite = Buffer.concat([header, rawBuffer]);
    
    // Calculate CRC32 over the composite buffer
    const crc = calculateCRC32Manual(composite);
    
    // Convert to hexadecimal string with leading zeros (8 characters)
    return crc.toString(16).padStart(8, '0');
  } catch (error) {
    throw new Error(`Failed to calculate pixel checksum for ${pngPath}: ${error.message}`);
  }
}

/**
 * Calculate CRC32 checksum for a file (legacy method for compatibility)
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} CRC32 checksum as 8-character hexadecimal string
 * @deprecated Use calculatePixelChecksum for image files to avoid PNG metadata false positives
 */
async function calculateCRC32(filePath) {
  try {
    const buffer = await fs.readFile(filePath);
    
    // Try to use native zlib.crc32 if available (Node.js >= 17.5.0)
    let crc;
    if (typeof zlib.crc32 === 'function') {
      crc = zlib.crc32(buffer);
    } else {
      // Fallback to manual CRC32 calculation for older Node.js versions
      crc = calculateCRC32Manual(buffer);
    }
    
    // Convert to hexadecimal string with leading zeros (8 characters)
    return crc.toString(16).padStart(8, '0');
  } catch (error) {
    throw new Error(`Failed to calculate CRC32 for ${filePath}: ${error.message}`);
  }
}

/**
 * Calculate SimHash (64-bit, folded to 32-bit) from text
 * Tokenizes text by whitespace, hashes each token, creates a 64-bit fingerprint, then folds to 32-bit using XOR
 * @param {string} text - Text to hash
 * @returns {string} 32-bit hash as 8-character lowercase hexadecimal string
 */
function calculateSimHash(text) {
  // Normalize: lowercase and collapse whitespace
  const normalized = text.toLowerCase().split(/\s+/).filter(token => token.length > 0);
  
  // Initialize 64-bit fingerprint (we'll use two 32-bit numbers)
  let fp_high = 0;
  let fp_low = 0;
  
  // For each token, compute a hash and add to fingerprint
  for (const token of normalized) {
    // Simple hash function for the token
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = ((hash << 5) - hash) + token.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to unsigned 32-bit
    hash = hash >>> 0;
    
    // Add hash contribution to 64-bit fingerprint
    // For each bit in the hash, if bit is 1, increment that position in fingerprint
    for (let i = 0; i < 32; i++) {
      if (hash & (1 << i)) {
        // Increment bit counter
        if (i < 32) {
          fp_low = (fp_low >>> 0) + (1 << i);
          fp_low = fp_low >>> 0;
        }
      }
    }
  }
  
  // Build final 64-bit fingerprint: if counter >= threshold, set bit to 1
  const threshold = normalized.length / 2;
  let result_low = 0;
  let result_high = 0;
  
  for (let i = 0; i < 32; i++) {
    const bit_count = (fp_low >> i) & 0xFF; // Get counter for this bit position
    if (bit_count >= threshold) {
      result_low |= (1 << i);
    }
  }
  
  // For a simpler 64-bit implementation, we'll use the hash distribution
  // Fold 64-bit to 32-bit using XOR of high and low words
  const folded = (result_high ^ result_low) >>> 0;
  
  // Return as 8-character lowercase hex
  return folded.toString(16).padStart(8, '0');
}

/**
 * Calculate text-based SimHash checksum from DOM text content
 * @param {string} text - Extracted visible text from DOM
 * @returns {string} 32-bit SimHash as 8-character hexadecimal string, or magic number 0xdeadbeef on error
 */
function calculateTextChecksum(text) {
  try {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      // Return magic number for empty/invalid text
      return 'deadbeef';
    }
    
    return calculateSimHash(text);
  } catch (error) {
    // Return magic number to indicate calculation error
    console.error('Error calculating SimHash:', error.message);
    return 'deadbeef';
  }
}

/**
 * Generate and save CRC32 checksum file for a screenshot
 * @param {string} screenshotPath - Path to the screenshot file
 * @param {boolean} useTextBased - If true, use text-based SimHash; if false, use pixel-based CRC32
 * @param {string} extractedText - Extracted visible text (required if useTextBased is true)
 * @param {string} indent - Indentation prefix for logging
 */
async function generateChecksumFile(screenshotPath, useTextBased = false, extractedText = '', indent = '') {
  try {
    let checksum;
    
    if (useTextBased) {
      console.log(`${indent}🔐 Generating text-based SimHash checksum...`);
      
      // Calculate text-based checksum
      checksum = calculateTextChecksum(extractedText);
      
      if (checksum === 'deadbeef') {
        console.log(`${indent}⚠️  Text-based checksum calculation resulted in magic number (error indicator)`);
      }
    } else {
      console.log(`${indent}🔐 Generating pixel-based CRC32 checksum...`);
      
      // Calculate CRC32 checksum over raw pixel data (not PNG file)
      checksum = await calculatePixelChecksum(screenshotPath);
    }
    
    // Create checksum file path
    const checksumPath = `${screenshotPath}.crc32`;
    
    // Write checksum to file (plain text, lowercase hex)
    await fs.writeFile(checksumPath, checksum, 'utf8');
    
    const checksumType = useTextBased ? 'text-based SimHash' : 'pixel-based CRC32';
    console.log(`${indent}✅ ${checksumType} checksum saved: ${checksum}`);
    
    return checksum;
  } catch (error) {
    // Log warning but don't fail the screenshot process
    console.error(`${indent}⚠️  Failed to generate checksum file:`, error.message);
    console.log(`${indent}   Continuing without checksum file`);
    return null;
  }
}

module.exports = {
  calculateCRC32,
  calculatePixelChecksum,
  calculateSimHash,
  calculateTextChecksum,
  generateChecksumFile
};
