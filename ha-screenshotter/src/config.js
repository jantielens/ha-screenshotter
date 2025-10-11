/**
 * Configuration loading and validation
 */

const fs = require('fs-extra');
const { CONFIG_PATH } = require('./constants');

/**
 * Load configuration from Home Assistant
 * @returns {Object} Configuration object with schedule and urls
 * @throws {Error} When configuration values are invalid - causes container shutdown
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
    long_lived_access_token: "",
    run_once: false,
    webserverport: 0,
    language: "en"
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
          console.error('❌ Error parsing URLs:', parseError.message);
          console.error('ℹ️  Expected format: ["https://example.com", "https://example2.com"]');
          throw new Error(`Invalid URLs configuration: ${parseError.message}. Expected format: ["https://example.com", "https://example2.com"]`);
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
          console.error('❌ Invalid resolution_width:', config.resolution_width);
          throw new Error(`Invalid resolution_width: ${config.resolution_width}. Must be a positive integer.`);
        }
      }
      
      if (config.resolution_height !== undefined) {
        if (Number.isInteger(config.resolution_height) && config.resolution_height > 0) {
          resolution_height = config.resolution_height;
          console.log('✅ Resolution height from configuration:', resolution_height);
        } else {
          console.error('❌ Invalid resolution_height:', config.resolution_height);
          throw new Error(`Invalid resolution_height: ${config.resolution_height}. Must be a positive integer.`);
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
          console.error('❌ Invalid rotation_degrees:', config.rotation_degrees);
          throw new Error(`Invalid rotation_degrees: ${config.rotation_degrees}. Must be one of: 0, 90, 180, or 270.`);
        }
      }
      
      // Handle grayscale configuration
      let grayscale = defaultConfig.grayscale;
      if (config.grayscale !== undefined) {
        if (typeof config.grayscale === 'boolean') {
          grayscale = config.grayscale;
          console.log('✅ Grayscale setting from configuration:', grayscale);
        } else {
          console.error('❌ Invalid grayscale setting:', config.grayscale);
          throw new Error(`Invalid grayscale setting: ${config.grayscale}. Must be true or false.`);
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
          console.error('❌ Invalid bit_depth setting:', config.bit_depth);
          throw new Error(`Invalid bit_depth setting: ${config.bit_depth}. Must be one of: 1, 4, 8, 16, or 24.`);
        }
      }
      
      // Handle run_once configuration
      let run_once = defaultConfig.run_once;
      if (config.run_once !== undefined) {
        if (typeof config.run_once === 'boolean') {
          run_once = config.run_once;
          console.log('✅ Run once setting from configuration:', run_once);
        } else {
          console.error('❌ Invalid run_once setting:', config.run_once);
          throw new Error(`Invalid run_once setting: ${config.run_once}. Must be true or false.`);
        }
      }
      
      // Handle webserverport configuration
      let webserverport = defaultConfig.webserverport;
      if (config.webserverport !== undefined) {
        if (Number.isInteger(config.webserverport) && config.webserverport >= 0) {
          webserverport = config.webserverport;
          console.log('✅ Web server port from configuration:', webserverport);
        } else {
          console.error('❌ Invalid webserverport setting:', config.webserverport);
          throw new Error(`Invalid webserverport setting: ${config.webserverport}. Must be a non-negative integer.`);
        }
      }
      
      // Handle language configuration
      let language = defaultConfig.language;
      if (config.language !== undefined) {
        if (typeof config.language === 'string' && config.language.trim().length > 0) {
          language = config.language.trim();
          console.log('✅ Language setting from configuration:', language);
        } else {
          console.error('❌ Invalid language setting:', config.language);
          throw new Error(`Invalid language setting: ${config.language}. Must be a non-empty string.`);
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
        long_lived_access_token: config.long_lived_access_token || defaultConfig.long_lived_access_token,
        run_once: run_once,
        webserverport: webserverport,
        language: language
      };
    }
  } catch (error) {
    console.error('❌ Error loading configuration:', error.message);
    console.error('🛑 Container shutting down due to invalid configuration');
    throw error;
  }
  
  console.log('🔧 Using default configuration');
  return defaultConfig;
}

module.exports = {
  loadConfiguration
};
