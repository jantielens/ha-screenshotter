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
      {
        url: "https://google.com",
        width: 1920,
        height: 1080,
        rotation: 0,
        grayscale: false,
        bit_depth: 24
      },
      {
        url: "https://time.now/",
        width: 1920,
        height: 1080,
        rotation: 0,
        grayscale: false,
        bit_depth: 24
      }
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
      
      // Handle resolution configuration first (needed for URL defaults)
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
      
      // Parse URLs with per-URL settings (using global settings as defaults)
      let urls = defaultConfig.urls;
      if (config.urls) {
        try {
          // Parse URLs from JSON string format
          const parsedUrls = JSON.parse(config.urls);
          
          // Handle array format (backward compatibility)
          if (Array.isArray(parsedUrls)) {
            urls = parsedUrls.map((urlItem, index) => {
              if (typeof urlItem === 'string') {
                // Simple string URL - use global defaults
                return {
                  url: urlItem,
                  width: resolution_width,
                  height: resolution_height,
                  rotation: rotation_degrees,
                  grayscale: grayscale,
                  bit_depth: bit_depth
                };
              } else if (typeof urlItem === 'object' && urlItem.url) {
                // Object with url property and optional overrides
                return {
                  url: urlItem.url,
                  width: urlItem.width || resolution_width,
                  height: urlItem.height || resolution_height,
                  rotation: urlItem.rotation !== undefined ? urlItem.rotation : rotation_degrees,
                  grayscale: urlItem.grayscale !== undefined ? urlItem.grayscale : grayscale,
                  bit_depth: urlItem.bit_depth || bit_depth
                };
              } else {
                throw new Error(`Invalid URL at index ${index}: must be a string or object with 'url' property`);
              }
            });
          } 
          // Handle object format (new feature)
          else if (typeof parsedUrls === 'object' && parsedUrls !== null) {
            urls = Object.entries(parsedUrls).map(([url, settings]) => {
              if (typeof settings === 'object' && settings !== null) {
                return {
                  url: url,
                  width: settings.width || resolution_width,
                  height: settings.height || resolution_height,
                  rotation: settings.rotation !== undefined ? settings.rotation : rotation_degrees,
                  grayscale: settings.grayscale !== undefined ? settings.grayscale : grayscale,
                  bit_depth: settings.bit_depth || bit_depth
                };
              } else {
                // Empty settings object or null - use defaults
                return {
                  url: url,
                  width: resolution_width,
                  height: resolution_height,
                  rotation: rotation_degrees,
                  grayscale: grayscale,
                  bit_depth: bit_depth
                };
              }
            });
          } else {
            throw new Error('URLs must be an array or an object');
          }
          
          // Validate each URL configuration
          urls.forEach((urlConfig, index) => {
            if (!urlConfig.url || typeof urlConfig.url !== 'string') {
              throw new Error(`Invalid URL at index ${index}: URL must be a non-empty string`);
            }
            if (!Number.isInteger(urlConfig.width) || urlConfig.width <= 0) {
              throw new Error(`Invalid width for URL ${urlConfig.url}: must be a positive integer`);
            }
            if (!Number.isInteger(urlConfig.height) || urlConfig.height <= 0) {
              throw new Error(`Invalid height for URL ${urlConfig.url}: must be a positive integer`);
            }
            if (!Number.isInteger(urlConfig.rotation) || ![0, 90, 180, 270].includes(urlConfig.rotation)) {
              throw new Error(`Invalid rotation for URL ${urlConfig.url}: must be 0, 90, 180, or 270`);
            }
            if (typeof urlConfig.grayscale !== 'boolean') {
              throw new Error(`Invalid grayscale for URL ${urlConfig.url}: must be true or false`);
            }
            if (!Number.isInteger(urlConfig.bit_depth) || ![1, 4, 8, 16, 24].includes(urlConfig.bit_depth)) {
              throw new Error(`Invalid bit_depth for URL ${urlConfig.url}: must be 1, 4, 8, 16, or 24`);
            }
          });
          
          console.log('✅ URLs parsed from configuration:', urls.length, 'URLs with individual settings');
          urls.forEach((urlConfig, index) => {
            console.log(`   ${index}: ${urlConfig.url} (${urlConfig.width}x${urlConfig.height}, ${urlConfig.rotation}°, grayscale:${urlConfig.grayscale}, ${urlConfig.bit_depth}-bit)`);
          });
        } catch (parseError) {
          console.error('❌ Error parsing URLs:', parseError.message);
          console.error('ℹ️  Expected formats:');
          console.error('     Array: ["https://example.com", "https://example2.com"]');
          console.error('     Array with objects: [{"url": "https://example.com", "width": 800}]');
          console.error('     Object: {"https://example.com": {"width": 800, "height": 600}}');
          throw new Error(`Invalid URLs configuration: ${parseError.message}`);
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