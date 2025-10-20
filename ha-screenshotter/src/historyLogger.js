/**
 * Screenshot History Logger
 * Stores original/processed screenshots and metadata for debugging
 */

const fs = require('fs-extra');
const path = require('path');
const { SCREENSHOT_HISTORY_PATH } = require('./constants');

// Retention period in ms (48 hours)
const RETENTION_PERIOD_MS = 48 * 60 * 60 * 1000;

/**
 * Format date to YYYYMMDD-HHMMSS
 */
function formatDate(date) {
  const pad = n => n.toString().padStart(2, '0');
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) + '-' +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

/**
 * Save history data for a screenshot (flat file structure)
 * @param {Buffer} originalBuffer
 * @param {Buffer} processedBuffer
 * @param {Object} metadata
 * @returns {Promise<string[]>} Array of saved file paths
 */
async function saveScreenshotHistory(originalBuffer, processedBuffer, metadata) {
  const date = new Date();
  const ts = formatDate(date);
  const crc32 = metadata.crc32_value || 'nocrc';
  // Use url index, pad to 3 digits
  const urlIndex = typeof metadata.index === 'number' ? String(metadata.index).padStart(3, '0') : '000';
  const base = `url${urlIndex}-${ts}-${crc32}`;
  // Ensure the history folder exists
  await fs.ensureDir(SCREENSHOT_HISTORY_PATH);
  const files = [
    { name: `${base}-original.png`, data: originalBuffer },
    { name: `${base}-processed.png`, data: processedBuffer },
    { name: `${base}-metadata.json`, data: Buffer.from(JSON.stringify(metadata, null, 2)) }
  ];
  await Promise.all(files.map(f => fs.writeFile(path.join(SCREENSHOT_HISTORY_PATH, f.name), f.data)));
  return files.map(f => path.join(SCREENSHOT_HISTORY_PATH, f.name));
}

/**
 * Delete history entries older than retention period
 * @returns {Promise<void>}
 */
async function cleanupOldHistory() {
  const now = Date.now();
  const entries = await fs.readdir(SCREENSHOT_HISTORY_PATH);
  for (const entry of entries) {
    const entryPath = path.join(SCREENSHOT_HISTORY_PATH, entry);
    // Match url{index}-YYYYMMDD-HHMMSS-crc32value-(original|processed|metadata).(png|json)
    const match = entry.match(/^url\d+-(\d{8}-\d{6})-(.+?)-(original|processed|metadata)\.(png|json)$/);
    if (match) {
      // Parse date from filename (match[1] contains YYYYMMDD-HHMMSS)
      const dateStr = match[1];
      const year = parseInt(dateStr.slice(0, 4));
      const month = parseInt(dateStr.slice(4, 6)) - 1;
      const day = parseInt(dateStr.slice(6, 8));
      const hour = parseInt(dateStr.slice(9, 11));
      const min = parseInt(dateStr.slice(11, 13));
      const sec = parseInt(dateStr.slice(13, 15));
      const fileDate = new Date(year, month, day, hour, min, sec);
      if (now - fileDate.getTime() > RETENTION_PERIOD_MS) {
        await fs.remove(entryPath);
      }
    }
  }
}

module.exports = {
  saveScreenshotHistory,
  cleanupOldHistory,
  RETENTION_PERIOD_MS
};
