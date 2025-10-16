/**
 * Checksum utility for generating CRC32 checksums
 */

const fs = require('fs-extra');
const path = require('path');
const zlib = require('zlib');

/**
 * Calculate CRC32 checksum manually (compatible with all Node.js versions)
 * @param {Buffer} buffer - Buffer to calculate CRC32 for
 * @returns {number} CRC32 checksum as unsigned 32-bit integer
 */
function calculateCRC32Manual(buffer) {
  // CRC32 lookup table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    crcTable[n] = c;
  }
  
  // Calculate CRC32
  let crc = 0 ^ (-1);
  for (let i = 0; i < buffer.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buffer[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

/**
 * Calculate CRC32 checksum for a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} CRC32 checksum as 8-character hexadecimal string
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
 * Generate and save CRC32 checksum file for a screenshot
 * @param {string} screenshotPath - Path to the screenshot file
 * @param {string} indent - Indentation prefix for logging
 */
async function generateChecksumFile(screenshotPath, indent = '') {
  try {
    console.log(`${indent}🔐 Generating CRC32 checksum...`);
    
    // Calculate CRC32 checksum
    const checksum = await calculateCRC32(screenshotPath);
    
    // Create checksum file path
    const checksumPath = `${screenshotPath}.crc32`;
    
    // Write checksum to file (plain text, lowercase hex)
    await fs.writeFile(checksumPath, checksum, 'utf8');
    
    console.log(`${indent}✅ CRC32 checksum saved: ${checksum}`);
    
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
  generateChecksumFile
};
