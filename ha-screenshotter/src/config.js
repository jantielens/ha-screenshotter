/**
 * Configuration loading and validation
 */

const fs = require('fs-extra');
const { CONFIG_PATH } = require('./constants');

/**
 * Load configuration from Home Assistant
 * @returns {Object} Configuration object with schedule and urls
 */
async function loadConfiguration() {
  const defaultConfig = {
    schedule: "* * * * *",
    urls: [
      "https://google.com",
      "https://time.now/"
    ],
    resolution_width: 1920,
    resolution_height: 1080,
    rotation_degrees: 0,
    grayscale: false,
    bit_depth: 24,
    run_once: false,
    webserverport: 0
  };
  
  try {
    const configExists = await fs.pathExists(CONFIG_PATH);
    if (configExists) {
      const config = await fs.readJson(CONFIG_PATH);
      
      let urls = defaultConfig.urls;
      if (config.urls) {
        try {
          // Parse URLs from JSON string format
          urls = JSON.parse(config.urls);
          if (!Array.isArray(urls)) {
            throw new Error('URLs must be an array');
          }
          console.log('✅ URLs parsed from configuration:', urls);
        } catch (parseError) {
          console.error('⚠️  Error parsing URLs, using defaults:', parseError.message);
          console.log('ℹ️  Expected format: ["https://example.com", "https://example2.com"]');
          urls = defaultConfig.urls;
        }
      }
      
      // Handle resolution configuration
      let resolution_width = defaultConfig.resolution_width;
      let resolution_height = defaultConfig.resolution_height;
      
      if (config.resolution_width !== undefined) {
        if (Number.isInteger(config.resolution_width) && config.resolution_width > 0) {
          resolution_width = config.resolution_width;
          console.log('✅ Resolution width from configuration:', resolution_width);
        } else {
          console.error('⚠️  Invalid resolution_width, using default:', defaultConfig.resolution_width);
        }
      }
      
      if (config.resolution_height !== undefined) {
        if (Number.isInteger(config.resolution_height) && config.resolution_height > 0) {
          resolution_height = config.resolution_height;
          console.log('✅ Resolution height from configuration:', resolution_height);
        } else {
          console.error('⚠️  Invalid resolution_height, using default:', defaultConfig.resolution_height);
        }
      }
      
      // Handle rotation configuration
      let rotation_degrees = defaultConfig.rotation_degrees;
      if (config.rotation_degrees !== undefined) {
        const validRotations = [0, 90, 180, 270];
        if (Number.isInteger(config.rotation_degrees) && validRotations.includes(config.rotation_degrees)) {
          rotation_degrees = config.rotation_degrees;
          console.log('✅ Rotation degrees from configuration:', rotation_degrees);
        } else {
          console.error('⚠️  Invalid rotation_degrees (must be 0, 90, 180, or 270), using default:', defaultConfig.rotation_degrees);
        }
      }
      
      // Handle grayscale configuration
      let grayscale = defaultConfig.grayscale;
      if (config.grayscale !== undefined) {
        if (typeof config.grayscale === 'boolean') {
          grayscale = config.grayscale;
          console.log('✅ Grayscale setting from configuration:', grayscale);
        } else {
          console.error('⚠️  Invalid grayscale setting (must be true or false), using default:', defaultConfig.grayscale);
        }
      }
      
      // Handle bit depth configuration
      let bit_depth = defaultConfig.bit_depth;
      if (config.bit_depth !== undefined) {
        const validBitDepths = [1, 4, 8, 16, 24];
        if (Number.isInteger(config.bit_depth) && validBitDepths.includes(config.bit_depth)) {
          bit_depth = config.bit_depth;
          console.log('✅ Bit depth setting from configuration:', bit_depth);
        } else {
          console.error('⚠️  Invalid bit_depth setting (must be 1, 4, 8, 16, or 24), using default:', defaultConfig.bit_depth);
        }
      }
      
      // Handle run_once configuration
      let run_once = defaultConfig.run_once;
      if (config.run_once !== undefined) {
        if (typeof config.run_once === 'boolean') {
          run_once = config.run_once;
          console.log('✅ Run once setting from configuration:', run_once);
        } else {
          console.error('⚠️  Invalid run_once setting (must be true or false), using default:', defaultConfig.run_once);
        }
      }
      
      // Handle webserverport configuration
      let webserverport = defaultConfig.webserverport;
      if (config.webserverport !== undefined) {
        if (Number.isInteger(config.webserverport) && config.webserverport >= 0) {
          webserverport = config.webserverport;
          console.log('✅ Web server port from configuration:', webserverport);
        } else {
          console.error('⚠️  Invalid webserverport setting (must be a non-negative integer), using default:', defaultConfig.webserverport);
        }
      }
      
      return {
        schedule: config.schedule || defaultConfig.schedule,
        urls: urls,
        resolution_width: resolution_width,
        resolution_height: resolution_height,
        rotation_degrees: rotation_degrees,
        grayscale: grayscale,
        bit_depth: bit_depth,
        run_once: run_once,
        webserverport: webserverport
      };
    }
  } catch (error) {
    console.error('⚠️  Error loading configuration:', error.message);
  }
  
  console.log('🔧 Using default configuration');
  return defaultConfig;
}

module.exports = {
  loadConfiguration
};
