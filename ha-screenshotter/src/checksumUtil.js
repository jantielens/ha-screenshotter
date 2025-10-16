/**
 * Checksum utility for generating CRC32 checksums
 */

const fs = require('fs-extra');
const path = require('path');
const zlib = require('zlib');

/**
 * Calculate CRC32 checksum for a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} CRC32 checksum as 8-character hexadecimal string
 */
async function calculateCRC32(filePath) {
  try {
    const buffer = await fs.readFile(filePath);
    const crc = zlib.crc32(buffer);
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
