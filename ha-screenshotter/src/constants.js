/**
 * Constants used throughout the application
 */

const path = require('path');

// Configuration paths (Home Assistant standard paths)
const CONFIG_PATH = '/data/options.json';
// Write screenshots to the Home Assistant media folder so files are available at /media/
const WWW_PATH = '/media';

// History folder for extra screenshot logging
const SCREENSHOT_HISTORY_PATH = path.join(WWW_PATH, 'screenshot-history');
const SCREENSHOTS_PATH = path.join(WWW_PATH, 'ha-screenshotter');

module.exports = {
  CONFIG_PATH,
  WWW_PATH,
  SCREENSHOTS_PATH,
  SCREENSHOT_HISTORY_PATH
};
