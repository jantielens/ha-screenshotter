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
        bit_depth: 24,
        crop: null,
        device_emulation: "desktop",
        advanced_processing: null,
        use_text_based_crc32: false
      },
      {
        url: "https://time.now/",
        width: 1920,
        height: 1080,
        rotation: 0,
        grayscale: false,
        bit_depth: 24,
        crop: null,
        device_emulation: "desktop",
        advanced_processing: null,
        use_text_based_crc32: false
      }
    ],
    resolution_width: 1920,
    resolution_height: 1080,
    rotation_degrees: 0,
    grayscale: false,
    bit_depth: 24,
    crop: null,
    device_emulation: "desktop",
    mobile_viewport: null,
    long_lived_access_token: "",
    run_once: false,
    webserverport: 0,
    language: "en",
    contrast: 1.0,
    saturation: 1.0,
    gamma_correction: 1.0,
    black_level: "0%",
    white_level: "100%",
    remove_gamma: false
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
      
      // Handle crop configuration
      let crop = defaultConfig.crop;
      if (config.crop !== undefined) {
        if (config.crop === null || config.crop === false) {
          crop = null;
          console.log('✅ Crop setting disabled from configuration');
        } else if (typeof config.crop === 'object' && config.crop !== null) {
          // Validate crop object
          const requiredFields = ['x', 'y', 'width', 'height'];
          const missingFields = requiredFields.filter(field => !(field in config.crop));
          if (missingFields.length > 0) {
            throw new Error(`Invalid crop configuration: missing required fields: ${missingFields.join(', ')}`);
          }
          
          // Validate crop values
          if (!Number.isInteger(config.crop.x) || config.crop.x < 0) {
            throw new Error(`Invalid crop x coordinate: ${config.crop.x}. Must be a non-negative integer.`);
          }
          if (!Number.isInteger(config.crop.y) || config.crop.y < 0) {
            throw new Error(`Invalid crop y coordinate: ${config.crop.y}. Must be a non-negative integer.`);
          }
          if (!Number.isInteger(config.crop.width) || config.crop.width <= 0) {
            throw new Error(`Invalid crop width: ${config.crop.width}. Must be a positive integer.`);
          }
          if (!Number.isInteger(config.crop.height) || config.crop.height <= 0) {
            throw new Error(`Invalid crop height: ${config.crop.height}. Must be a positive integer.`);
          }
          
          crop = {
            x: config.crop.x,
            y: config.crop.y,
            width: config.crop.width,
            height: config.crop.height
          };
          console.log('✅ Crop setting from configuration:', `(${crop.x}, ${crop.y}) ${crop.width}x${crop.height}`);
        } else {
          console.error('❌ Invalid crop setting:', config.crop);
          throw new Error(`Invalid crop setting: ${config.crop}. Must be null, false, or an object with x, y, width, and height properties.`);
        }
      }
      
      // Handle device_emulation configuration (BEFORE URLs parsing)
      let device_emulation = defaultConfig.device_emulation;
      if (config.device_emulation !== undefined) {
        if (typeof config.device_emulation === 'string') {
          device_emulation = config.device_emulation;
          console.log('✅ Device emulation setting from configuration:', device_emulation);
        } else {
          console.error('❌ Invalid device_emulation setting:', config.device_emulation);
          throw new Error(`Invalid device_emulation setting: ${config.device_emulation}. Must be a string.`);
        }
      }
      
      // Handle mobile_viewport configuration (BEFORE URLs parsing)
      let mobile_viewport = defaultConfig.mobile_viewport;
      if (config.mobile_viewport !== undefined) {
        if (config.mobile_viewport === null || config.mobile_viewport === false) {
          mobile_viewport = null;
          console.log('✅ Mobile viewport disabled from configuration');
        } else if (typeof config.mobile_viewport === 'object' && config.mobile_viewport !== null) {
          // Validate mobile viewport object
          if (config.mobile_viewport.width !== undefined && (!Number.isInteger(config.mobile_viewport.width) || config.mobile_viewport.width <= 0)) {
            throw new Error(`Invalid mobile_viewport width: ${config.mobile_viewport.width}. Must be a positive integer.`);
          }
          if (config.mobile_viewport.height !== undefined && (!Number.isInteger(config.mobile_viewport.height) || config.mobile_viewport.height <= 0)) {
            throw new Error(`Invalid mobile_viewport height: ${config.mobile_viewport.height}. Must be a positive integer.`);
          }
          if (config.mobile_viewport.device_scale_factor !== undefined && (typeof config.mobile_viewport.device_scale_factor !== 'number' || config.mobile_viewport.device_scale_factor <= 0)) {
            throw new Error(`Invalid mobile_viewport device_scale_factor: ${config.mobile_viewport.device_scale_factor}. Must be a positive number.`);
          }
          if (config.mobile_viewport.touch_enabled !== undefined && typeof config.mobile_viewport.touch_enabled !== 'boolean') {
            throw new Error(`Invalid mobile_viewport touch_enabled: ${config.mobile_viewport.touch_enabled}. Must be a boolean.`);
          }
          if (config.mobile_viewport.is_landscape !== undefined && typeof config.mobile_viewport.is_landscape !== 'boolean') {
            throw new Error(`Invalid mobile_viewport is_landscape: ${config.mobile_viewport.is_landscape}. Must be a boolean.`);
          }
          if (config.mobile_viewport.user_agent !== undefined && typeof config.mobile_viewport.user_agent !== 'string') {
            throw new Error(`Invalid mobile_viewport user_agent: ${config.mobile_viewport.user_agent}. Must be a string.`);
          }
          
          mobile_viewport = config.mobile_viewport;
          console.log('✅ Mobile viewport setting from configuration:', JSON.stringify(mobile_viewport));
        } else {
          console.error('❌ Invalid mobile_viewport setting:', config.mobile_viewport);
          throw new Error(`Invalid mobile_viewport setting: ${config.mobile_viewport}. Must be null, false, or an object.`);
        }
      }
      
      // Handle contrast configuration
      let contrast = defaultConfig.contrast;
      if (config.contrast !== undefined) {
        if (typeof config.contrast === 'number' && config.contrast > 0) {
          contrast = config.contrast;
          console.log('✅ Contrast setting from configuration:', contrast);
        } else {
          console.error('❌ Invalid contrast setting:', config.contrast);
          throw new Error(`Invalid contrast setting: ${config.contrast}. Must be a positive number.`);
        }
      }
      
      // Handle saturation configuration
      let saturation = defaultConfig.saturation;
      if (config.saturation !== undefined) {
        if (typeof config.saturation === 'number' && config.saturation >= 0) {
          saturation = config.saturation;
          console.log('✅ Saturation setting from configuration:', saturation);
        } else {
          console.error('❌ Invalid saturation setting:', config.saturation);
          throw new Error(`Invalid saturation setting: ${config.saturation}. Must be a non-negative number.`);
        }
      }
      
      // Handle gamma_correction configuration
      let gamma_correction = defaultConfig.gamma_correction;
      if (config.gamma_correction !== undefined) {
        if (typeof config.gamma_correction === 'number' && config.gamma_correction > 0) {
          gamma_correction = config.gamma_correction;
          console.log('✅ Gamma correction setting from configuration:', gamma_correction);
        } else {
          console.error('❌ Invalid gamma_correction setting:', config.gamma_correction);
          throw new Error(`Invalid gamma_correction setting: ${config.gamma_correction}. Must be a positive number.`);
        }
      }
      
      // Handle black_level configuration
      let black_level = defaultConfig.black_level;
      if (config.black_level !== undefined) {
        if (typeof config.black_level === 'string' && /^\d+(\.\d+)?%$/.test(config.black_level)) {
          const value = parseFloat(config.black_level.replace('%', ''));
          if (value >= 0 && value <= 100) {
            black_level = config.black_level;
            console.log('✅ Black level setting from configuration:', black_level);
          } else {
            throw new Error(`Invalid black_level value: ${config.black_level}. Percentage must be between 0% and 100%.`);
          }
        } else {
          console.error('❌ Invalid black_level setting:', config.black_level);
          throw new Error(`Invalid black_level setting: ${config.black_level}. Must be a percentage string (e.g., "30%").`);
        }
      }
      
      // Handle white_level configuration
      let white_level = defaultConfig.white_level;
      if (config.white_level !== undefined) {
        if (typeof config.white_level === 'string' && /^\d+(\.\d+)?%$/.test(config.white_level)) {
          const value = parseFloat(config.white_level.replace('%', ''));
          if (value >= 0 && value <= 100) {
            white_level = config.white_level;
            console.log('✅ White level setting from configuration:', white_level);
          } else {
            throw new Error(`Invalid white_level value: ${config.white_level}. Percentage must be between 0% and 100%.`);
          }
        } else {
          console.error('❌ Invalid white_level setting:', config.white_level);
          throw new Error(`Invalid white_level setting: ${config.white_level}. Must be a percentage string (e.g., "90%").`);
        }
      }
      
      // Handle remove_gamma configuration
      let remove_gamma = defaultConfig.remove_gamma;
      if (config.remove_gamma !== undefined) {
        if (typeof config.remove_gamma === 'boolean') {
          remove_gamma = config.remove_gamma;
          console.log('✅ Remove gamma setting from configuration:', remove_gamma);
        } else {
          console.error('❌ Invalid remove_gamma setting:', config.remove_gamma);
          throw new Error(`Invalid remove_gamma setting: ${config.remove_gamma}. Must be true or false.`);
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
                // Build advanced processing object
                const advancedProcessing = {};
                if (contrast !== 1.0) advancedProcessing.contrast = contrast;
                if (saturation !== 1.0) advancedProcessing.saturation = saturation;
                if (gamma_correction !== 1.0) advancedProcessing.gamma = gamma_correction;
                if (black_level !== '0%') advancedProcessing.blackLevel = black_level;
                if (white_level !== '100%') advancedProcessing.whiteLevel = white_level;
                if (remove_gamma === true) advancedProcessing.removeGamma = remove_gamma;
                
                return {
                  url: urlItem,
                  width: resolution_width,
                  height: resolution_height,
                  rotation: rotation_degrees,
                  grayscale: grayscale,
                  bit_depth: bit_depth,
                  crop: crop,
                  device_emulation: device_emulation,
                  mobile_viewport: mobile_viewport,
                  advanced_processing: Object.keys(advancedProcessing).length > 0 ? advancedProcessing : null,
                  use_text_based_crc32: false
                };
              } else if (typeof urlItem === 'object' && urlItem.url) {
                // Object with url property and optional overrides
                let urlCrop = urlItem.crop !== undefined ? urlItem.crop : crop;
                
                // Validate per-URL crop settings
                if (urlCrop !== null && urlCrop !== false && typeof urlCrop === 'object') {
                  const requiredFields = ['x', 'y', 'width', 'height'];
                  const missingFields = requiredFields.filter(field => !(field in urlCrop));
                  if (missingFields.length > 0) {
                    throw new Error(`Invalid crop configuration for URL ${urlItem.url}: missing required fields: ${missingFields.join(', ')}`);
                  }
                  
                  // Validate crop values
                  if (!Number.isInteger(urlCrop.x) || urlCrop.x < 0) {
                    throw new Error(`Invalid crop x coordinate for URL ${urlItem.url}: ${urlCrop.x}. Must be a non-negative integer.`);
                  }
                  if (!Number.isInteger(urlCrop.y) || urlCrop.y < 0) {
                    throw new Error(`Invalid crop y coordinate for URL ${urlItem.url}: ${urlCrop.y}. Must be a non-negative integer.`);
                  }
                  if (!Number.isInteger(urlCrop.width) || urlCrop.width <= 0) {
                    throw new Error(`Invalid crop width for URL ${urlItem.url}: ${urlCrop.width}. Must be a positive integer.`);
                  }
                  if (!Number.isInteger(urlCrop.height) || urlCrop.height <= 0) {
                    throw new Error(`Invalid crop height for URL ${urlItem.url}: ${urlCrop.height}. Must be a positive integer.`);
                  }
                  
                  // Validate crop area fits within image dimensions
                  const urlWidth = urlItem.width || resolution_width;
                  const urlHeight = urlItem.height || resolution_height;
                  if (urlCrop.x + urlCrop.width > urlWidth) {
                    throw new Error(`Invalid crop area for URL ${urlItem.url}: crop extends beyond image width. Crop area (${urlCrop.x + urlCrop.width}) exceeds image width (${urlWidth}).`);
                  }
                  if (urlCrop.y + urlCrop.height > urlHeight) {
                    throw new Error(`Invalid crop area for URL ${urlItem.url}: crop extends beyond image height. Crop area (${urlCrop.y + urlCrop.height}) exceeds image height (${urlHeight}).`);
                  }
                } else if (urlCrop !== null && urlCrop !== false) {
                  throw new Error(`Invalid crop setting for URL ${urlItem.url}: ${urlCrop}. Must be null, false, or an object with x, y, width, and height properties.`);
                }
                
                // Build advanced processing object with per-URL overrides
                const urlContrast = urlItem.contrast !== undefined ? urlItem.contrast : contrast;
                const urlSaturation = urlItem.saturation !== undefined ? urlItem.saturation : saturation;
                const urlGamma = urlItem.gamma_correction !== undefined ? urlItem.gamma_correction : gamma_correction;
                const urlBlackLevel = urlItem.black_level !== undefined ? urlItem.black_level : black_level;
                const urlWhiteLevel = urlItem.white_level !== undefined ? urlItem.white_level : white_level;
                const urlRemoveGamma = urlItem.remove_gamma !== undefined ? urlItem.remove_gamma : remove_gamma;
                const urlUseTextBasedCrc32 = urlItem.use_text_based_crc32 !== undefined ? urlItem.use_text_based_crc32 : false;
                
                // Validate use_text_based_crc32
                if (typeof urlUseTextBasedCrc32 !== 'boolean') {
                  throw new Error(`Invalid use_text_based_crc32 for URL ${urlItem.url}: ${urlUseTextBasedCrc32}. Must be true or false.`);
                }
                
                const advancedProcessing = {};
                if (urlContrast !== 1.0) advancedProcessing.contrast = urlContrast;
                if (urlSaturation !== 1.0) advancedProcessing.saturation = urlSaturation;
                if (urlGamma !== 1.0) advancedProcessing.gamma = urlGamma;
                if (urlBlackLevel !== '0%') advancedProcessing.blackLevel = urlBlackLevel;
                if (urlWhiteLevel !== '100%') advancedProcessing.whiteLevel = urlWhiteLevel;
                if (urlRemoveGamma === true) advancedProcessing.removeGamma = urlRemoveGamma;
                
                return {
                  url: urlItem.url,
                  width: urlItem.width || resolution_width,
                  height: urlItem.height || resolution_height,
                  rotation: urlItem.rotation !== undefined ? urlItem.rotation : rotation_degrees,
                  grayscale: urlItem.grayscale !== undefined ? urlItem.grayscale : grayscale,
                  bit_depth: urlItem.bit_depth || bit_depth,
                  crop: urlCrop,
                  device_emulation: urlItem.device_emulation || device_emulation,
                  mobile_viewport: urlItem.mobile_viewport !== undefined ? urlItem.mobile_viewport : mobile_viewport,
                  advanced_processing: Object.keys(advancedProcessing).length > 0 ? advancedProcessing : null,
                  use_text_based_crc32: urlUseTextBasedCrc32
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
                let urlCrop = settings.crop !== undefined ? settings.crop : crop;
                
                // Validate per-URL crop settings
                if (urlCrop !== null && urlCrop !== false && typeof urlCrop === 'object') {
                  const requiredFields = ['x', 'y', 'width', 'height'];
                  const missingFields = requiredFields.filter(field => !(field in urlCrop));
                  if (missingFields.length > 0) {
                    throw new Error(`Invalid crop configuration for URL ${url}: missing required fields: ${missingFields.join(', ')}`);
                  }
                  
                  // Validate crop values
                  if (!Number.isInteger(urlCrop.x) || urlCrop.x < 0) {
                    throw new Error(`Invalid crop x coordinate for URL ${url}: ${urlCrop.x}. Must be a non-negative integer.`);
                  }
                  if (!Number.isInteger(urlCrop.y) || urlCrop.y < 0) {
                    throw new Error(`Invalid crop y coordinate for URL ${url}: ${urlCrop.y}. Must be a non-negative integer.`);
                  }
                  if (!Number.isInteger(urlCrop.width) || urlCrop.width <= 0) {
                    throw new Error(`Invalid crop width for URL ${url}: ${urlCrop.width}. Must be a positive integer.`);
                  }
                  if (!Number.isInteger(urlCrop.height) || urlCrop.height <= 0) {
                    throw new Error(`Invalid crop height for URL ${url}: ${urlCrop.height}. Must be a positive integer.`);
                  }
                  
                  // Validate crop area fits within image dimensions
                  const urlWidth = settings.width || resolution_width;
                  const urlHeight = settings.height || resolution_height;
                  if (urlCrop.x + urlCrop.width > urlWidth) {
                    throw new Error(`Invalid crop area for URL ${url}: crop extends beyond image width. Crop area (${urlCrop.x + urlCrop.width}) exceeds image width (${urlWidth}).`);
                  }
                  if (urlCrop.y + urlCrop.height > urlHeight) {
                    throw new Error(`Invalid crop area for URL ${url}: crop extends beyond image height. Crop area (${urlCrop.y + urlCrop.height}) exceeds image height (${urlHeight}).`);
                  }
                } else if (urlCrop !== null && urlCrop !== false) {
                  throw new Error(`Invalid crop setting for URL ${url}: ${urlCrop}. Must be null, false, or an object with x, y, width, and height properties.`);
                }
                
                // Build advanced processing object with per-URL overrides
                const urlContrast = settings.contrast !== undefined ? settings.contrast : contrast;
                const urlSaturation = settings.saturation !== undefined ? settings.saturation : saturation;
                const urlGamma = settings.gamma_correction !== undefined ? settings.gamma_correction : gamma_correction;
                const urlBlackLevel = settings.black_level !== undefined ? settings.black_level : black_level;
                const urlWhiteLevel = settings.white_level !== undefined ? settings.white_level : white_level;
                const urlRemoveGamma = settings.remove_gamma !== undefined ? settings.remove_gamma : remove_gamma;
                const urlUseTextBasedCrc32 = settings.use_text_based_crc32 !== undefined ? settings.use_text_based_crc32 : false;
                
                // Validate use_text_based_crc32
                if (typeof urlUseTextBasedCrc32 !== 'boolean') {
                  throw new Error(`Invalid use_text_based_crc32 for URL ${url}: ${urlUseTextBasedCrc32}. Must be true or false.`);
                }
                
                const advancedProcessing = {};
                if (urlContrast !== 1.0) advancedProcessing.contrast = urlContrast;
                if (urlSaturation !== 1.0) advancedProcessing.saturation = urlSaturation;
                if (urlGamma !== 1.0) advancedProcessing.gamma = urlGamma;
                if (urlBlackLevel !== '0%') advancedProcessing.blackLevel = urlBlackLevel;
                if (urlWhiteLevel !== '100%') advancedProcessing.whiteLevel = urlWhiteLevel;
                if (urlRemoveGamma === true) advancedProcessing.removeGamma = urlRemoveGamma;
                
                return {
                  url: url,
                  width: settings.width || resolution_width,
                  height: settings.height || resolution_height,
                  rotation: settings.rotation !== undefined ? settings.rotation : rotation_degrees,
                  grayscale: settings.grayscale !== undefined ? settings.grayscale : grayscale,
                  bit_depth: settings.bit_depth || bit_depth,
                  crop: urlCrop,
                  device_emulation: settings.device_emulation || device_emulation,
                  mobile_viewport: settings.mobile_viewport !== undefined ? settings.mobile_viewport : mobile_viewport,
                  advanced_processing: Object.keys(advancedProcessing).length > 0 ? advancedProcessing : null,
                  use_text_based_crc32: urlUseTextBasedCrc32
                };
              } else {
                // Empty settings object or null - use defaults
                // Build advanced processing object
                const advancedProcessing = {};
                if (contrast !== 1.0) advancedProcessing.contrast = contrast;
                if (saturation !== 1.0) advancedProcessing.saturation = saturation;
                if (gamma_correction !== 1.0) advancedProcessing.gamma = gamma_correction;
                if (black_level !== '0%') advancedProcessing.blackLevel = black_level;
                if (white_level !== '100%') advancedProcessing.whiteLevel = white_level;
                if (remove_gamma === true) advancedProcessing.removeGamma = remove_gamma;
                
                return {
                  url: url,
                  width: resolution_width,
                  height: resolution_height,
                  rotation: rotation_degrees,
                  grayscale: grayscale,
                  bit_depth: bit_depth,
                  crop: crop,
                  device_emulation: device_emulation,
                  mobile_viewport: mobile_viewport,
                  advanced_processing: Object.keys(advancedProcessing).length > 0 ? advancedProcessing : null,
                  use_text_based_crc32: false
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
            if (urlConfig.crop !== null && urlConfig.crop !== false) {
              if (typeof urlConfig.crop !== 'object') {
                throw new Error(`Invalid crop for URL ${urlConfig.url}: must be null, false, or an object`);
              }
              const requiredFields = ['x', 'y', 'width', 'height'];
              const missingFields = requiredFields.filter(field => !(field in urlConfig.crop));
              if (missingFields.length > 0) {
                throw new Error(`Invalid crop for URL ${urlConfig.url}: missing required fields: ${missingFields.join(', ')}`);
              }
            }
          });
          
          console.log('✅ URLs parsed from configuration:', urls.length, 'URLs with individual settings');
          urls.forEach((urlConfig, index) => {
            const cropText = urlConfig.crop ? `, crop:(${urlConfig.crop.x},${urlConfig.crop.y}) ${urlConfig.crop.width}x${urlConfig.crop.height}` : '';
            console.log(`   ${index}: ${urlConfig.url} (${urlConfig.width}x${urlConfig.height}, ${urlConfig.rotation}°, grayscale:${urlConfig.grayscale}, ${urlConfig.bit_depth}-bit${cropText})`);
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
        crop: crop,
        device_emulation: device_emulation,
        mobile_viewport: mobile_viewport,
        long_lived_access_token: config.long_lived_access_token || defaultConfig.long_lived_access_token,
        run_once: run_once,
        webserverport: webserverport,
        language: language,
        contrast: contrast,
        saturation: saturation,
        gamma_correction: gamma_correction,
        black_level: black_level,
        white_level: white_level,
        remove_gamma: remove_gamma
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