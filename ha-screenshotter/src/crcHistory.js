/**
 * CRC32 History Management
 * Stores and manages historical CRC32 checksum values for each screenshot
 */

const fs = require('fs-extra');
const path = require('path');
const { SCREENSHOTS_PATH } = require('./constants');

// Configuration
const HISTORY_LENGTH = 500;
const HISTORY_FILE = 'checksum-history.json';

// In-memory history storage: Map<screenshotIndex, Array<{timestamp, crc32}>>
const historyMap = new Map();

/**
 * Get path to history file
 * @returns {string} Full path to history file
 */
function getHistoryFilePath() {
  return path.join(SCREENSHOTS_PATH, HISTORY_FILE);
}

/**
 * Load history from disk
 * @returns {Promise<void>}
 */
async function loadHistory() {
  const historyPath = getHistoryFilePath();
  
  try {
    if (await fs.pathExists(historyPath)) {
      const data = await fs.readFile(historyPath, 'utf8');
      const loaded = JSON.parse(data);
      
      // Convert loaded data to Map
      historyMap.clear();
      for (const [key, value] of Object.entries(loaded)) {
        historyMap.set(parseInt(key), value);
      }
      
      console.log(`✅ Loaded CRC32 history for ${historyMap.size} screenshot(s)`);
    } else {
      console.log('ℹ️  No existing CRC32 history file found, starting fresh');
    }
  } catch (error) {
    console.error('⚠️  Failed to load CRC32 history:', error.message);
    console.log('   Starting with empty history');
    historyMap.clear();
  }
}

/**
 * Save history to disk atomically
 * @returns {Promise<void>}
 */
async function saveHistory() {
  const historyPath = getHistoryFilePath();
  const tempPath = `${historyPath}.tmp`;
  
  try {
    // Convert Map to plain object for JSON serialization
    const data = {};
    for (const [key, value] of historyMap.entries()) {
      data[key] = value;
    }
    
    // Write to temporary file
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
    
    // Atomically move to final location
    await fs.move(tempPath, historyPath, { overwrite: true });
  } catch (error) {
    console.error('⚠️  Failed to save CRC32 history:', error.message);
    
    // Clean up temp file if it exists
    try {
      if (await fs.pathExists(tempPath)) {
        await fs.remove(tempPath);
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Add a CRC32 value to history for a screenshot
 * @param {number} screenshotIndex - Index of the screenshot (0-based)
 * @param {string} crc32 - CRC32 checksum value (8-character hex string)
 * @returns {Promise<void>}
 */
async function addToHistory(screenshotIndex, crc32) {
  if (crc32 === null || crc32 === undefined) {
    // Don't add null/undefined values
    return;
  }
  
  // Get or create history array for this screenshot
  let history = historyMap.get(screenshotIndex);
  if (!history) {
    history = [];
    historyMap.set(screenshotIndex, history);
  }
  
  // Add new entry with timestamp
  const entry = {
    timestamp: new Date().toISOString(),
    crc32: crc32
  };
  
  history.push(entry);
  
  // Trim to HISTORY_LENGTH entries (keep most recent)
  if (history.length > HISTORY_LENGTH) {
    history.splice(0, history.length - HISTORY_LENGTH);
  }
  
  // Save to disk
  await saveHistory();
}

/**
 * Get full history for a screenshot
 * @param {number} screenshotIndex - Index of the screenshot (0-based)
 * @returns {Array<{timestamp: string, crc32: string}>} Array of history entries
 */
function getHistory(screenshotIndex) {
  return historyMap.get(screenshotIndex) || [];
}

/**
 * Get current (most recent) CRC32 value for a screenshot
 * @param {number} screenshotIndex - Index of the screenshot (0-based)
 * @returns {string|null} Most recent CRC32 value or null if no history
 */
function getCurrentCRC32(screenshotIndex) {
  const history = historyMap.get(screenshotIndex);
  if (history && history.length > 0) {
    return history[history.length - 1].crc32;
  }
  return null;
}

/**
 * Get all current CRC32 values for all screenshots
 * @returns {Object} Map of screenshot index to current CRC32 value
 */
function getAllCurrentCRC32() {
  const result = {};
  for (const [index, history] of historyMap.entries()) {
    if (history && history.length > 0) {
      result[index] = {
        crc32: history[history.length - 1].crc32,
        timestamp: history[history.length - 1].timestamp,
        historyCount: history.length
      };
    }
  }
  return result;
}

module.exports = {
  loadHistory,
  saveHistory,
  addToHistory,
  getHistory,
  getCurrentCRC32,
  getAllCurrentCRC32,
  HISTORY_LENGTH
};
