/**
 * Constants used throughout the application
 */

const path = require('path');

// Configuration paths (Home Assistant standard paths)
const CONFIG_PATH = '/data/options.json';
// Write screenshots to the Home Assistant media folder so files are available at /media/
const WWW_PATH = '/media';
const SCREENSHOTS_PATH = path.join(WWW_PATH, 'ha-screenshotter');

module.exports = {
  CONFIG_PATH,
  WWW_PATH,
  SCREENSHOTS_PATH
};
