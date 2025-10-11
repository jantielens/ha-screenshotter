#!/usr/bin/env node

/**
 * HA Screenshotter - Home Assistant Add-on
 * Step 2: Basic screenshot functionality
 */

const fs = require('fs-extra');
const path = require('path');
const puppeteer = require('puppeteer');
const cron = require('node-cron');
const Jimp = require('jimp');
const sharp = require('sharp');

// Configuration paths (Home Assistant standard paths)
const CONFIG_PATH = '/data/options.json';
// Write screenshots to the Home Assistant served www folder so files are available at /local/
const WWW_PATH = '/config/www';
const SCREENSHOTS_PATH = path.join(WWW_PATH, 'ha-screenshotter');

/**
 * Rotate an image by specified degrees
 * @param {string} imagePath - Path to the image file
 * @param {number} degrees - Rotation degrees (0, 90, 180, 270)
 */
async function rotateImage(imagePath, degrees) {
  if (degrees === 0) {
    return; // No rotation needed
  }
  
  try {
    console.log(`🔄 Rotating image ${degrees}°: ${imagePath}`);
    const image = await Jimp.read(imagePath);
    await image.rotate(degrees).writeAsync(imagePath);
    console.log(`✅ Image rotated successfully`);
  } catch (error) {
    console.error(`❌ Error rotating image:`, error.message);
    throw error;
  }
}

/**
 * Convert an image to grayscale
 * @param {string} imagePath - Path to the image file
 */
async function convertToGrayscale(imagePath) {
  try {
    console.log(`🎨 Converting image to grayscale: ${imagePath}`);
    const image = await Jimp.read(imagePath);
    await image.greyscale().writeAsync(imagePath);
    console.log(`✅ Image converted to grayscale successfully`);
  } catch (error) {
    console.error(`❌ Error converting image to grayscale:`, error.message);
    throw error;
  }
}

/**
 * Reduce image bit depth using Sharp - processes PNG files for true bit depth control
 * @param {string} imagePath - Path to the PNG image file
 * @param {number} bitDepth - Target bit depth (1, 4, 8, 16, 24)
 */
async function reduceBitDepth(imagePath, bitDepth) {
  if (bitDepth === 24) {
    return; // No reduction needed for 24-bit
  }
  
  try {
    console.log(`🎨 Reducing image bit depth to ${bitDepth}-bit: ${imagePath}`);
    
    let processedBuffer;
    
    switch (bitDepth) {
      case 1:
        // 1-bit: Convert to pure black and white with palette
        processedBuffer = await sharp(imagePath)
          .threshold(128)
          .png({ palette: true, colors: 2, dither: 1.0 })
          .toBuffer();
        break;
        
      case 4:
        // 4-bit: 16 colors with dithering
        processedBuffer = await sharp(imagePath)
          .png({ palette: true, colors: 16, dither: 1.0 })
          .toBuffer();
        break;
        
      case 8:
        // 8-bit: 256 colors with dithering
        processedBuffer = await sharp(imagePath)
          .png({ palette: true, colors: 256, dither: 1.0 })
          .toBuffer();
        break;
        
      case 16:
        // 16-bit: Save as 16-bit PNG
        processedBuffer = await sharp(imagePath)
          .png({ compressionLevel: 6 })
          .toBuffer();
        break;
        
      default:
        console.log(`⚠️  Unsupported bit depth ${bitDepth}, skipping reduction`);
        return;
    }
    
    // Write the processed buffer back to the original file
    await fs.writeFile(imagePath, processedBuffer);
    console.log(`✅ Image bit depth reduced to ${bitDepth}-bit successfully`);
    
  } catch (error) {
    console.error(`❌ Error reducing image bit depth:`, error.message);
    // If bit depth reduction fails, just log the error but don't crash
    console.log(`⚠️  Continuing without bit depth reduction for ${imagePath}`);
  }
}

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
    run_once: false
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
      
      return {
        schedule: config.schedule || defaultConfig.schedule,
        urls: urls,
        resolution_width: resolution_width,
        resolution_height: resolution_height,
        rotation_degrees: rotation_degrees,
        grayscale: grayscale,
        bit_depth: bit_depth,
        run_once: run_once
      };
    }
  } catch (error) {
    console.error('⚠️  Error loading configuration:', error.message);
  }
  
  console.log('🔧 Using default configuration');
  return defaultConfig;
}

/**
 * Take a screenshot of a given URL
 * @param {string} url - The URL to screenshot
 * @param {number} index - The index of the URL (used for filename)
 * @param {number} width - The viewport width for the screenshot
 * @param {number} height - The viewport height for the screenshot
 * @param {number} rotationDegrees - Degrees to rotate the screenshot (0, 90, 180, 270)
 * @param {boolean} grayscale - Whether to convert the screenshot to grayscale
 * @param {number} bitDepth - Target bit depth (1, 4, 8, 16, 24)
 */
async function takeScreenshot(url, index, width, height, rotationDegrees = 0, grayscale = false, bitDepth = 24) {
  console.log(`📸 Taking screenshot of: ${url}`);
  
  let browser = null;
  try {
    // Check if Chromium is available
    const fs = require('fs');
    if (!fs.existsSync('/usr/bin/chromium-browser')) {
      throw new Error('Chromium browser not found at /usr/bin/chromium-browser');
    }
    console.log('✅ Chromium browser found');
    
    // Log system info for debugging
    console.log('🖥️  System info:', {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
    });
    
    // Launch Puppeteer with minimal configuration first
    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run'
      ]
    });
    
    console.log('✅ Browser launched successfully');

    const page = await browser.newPage();
    
    // Set viewport size for consistent screenshots
    console.log(`📐 Setting viewport to ${width}x${height}`);
    await page.setViewport({ width: width, height: height });
    
    // Navigate to the URL with timeout
    console.log(`🌐 Navigating to: ${url}`);
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    // Wait for the page to be fully loaded
    await page.waitForFunction('document.readyState === "complete"');
    
    // Take the screenshot
    const filename = `${index}.png`;
    let screenshotPath = path.join(SCREENSHOTS_PATH, filename);
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: false,
      type: 'png'
    });
    
  console.log(`✅ Screenshot saved: ${screenshotPath}`);
  // Log public URL for Home Assistant (served at /local/ha-screenshotter/)
  const publicUrl = `/local/ha-screenshotter/${filename}`;
  console.log(`🌐 Accessible via Home Assistant at: ${publicUrl}`);
    
    // Apply rotation if needed
    if (rotationDegrees !== 0) {
      await rotateImage(screenshotPath, rotationDegrees);
    }
    
    // Apply grayscale conversion if needed
    if (grayscale) {
      await convertToGrayscale(screenshotPath);
    }
    
    // Apply bit depth reduction if needed
    if (bitDepth !== 24) {
      await reduceBitDepth(screenshotPath, bitDepth);
    }
    
    return screenshotPath;
    
  } catch (error) {
    console.error(`❌ Error taking screenshot of ${url}:`, error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Take screenshots of all configured URLs
 * @param {Array} urls - Array of URLs to screenshot
 * @param {number} width - The viewport width for the screenshots
 * @param {number} height - The viewport height for the screenshots
 * @param {number} rotationDegrees - Degrees to rotate the screenshots (0, 90, 180, 270)
 * @param {boolean} grayscale - Whether to convert the screenshots to grayscale
 * @param {number} bitDepth - Target bit depth (1, 4, 8, 16, 24)
 */
async function takeAllScreenshots(urls, width, height, rotationDegrees = 0, grayscale = false, bitDepth = 24) {
  const rotationText = rotationDegrees > 0 ? ` with ${rotationDegrees}° rotation` : '';
  const grayscaleText = grayscale ? ' in grayscale' : '';
  const bitDepthText = bitDepth !== 24 ? ` at ${bitDepth}-bit depth` : '';
  console.log(`📸 Taking screenshots of ${urls.length} URL(s) at ${width}x${height}${rotationText}${grayscaleText}${bitDepthText}...`);
  
  for (let i = 0; i < urls.length; i++) {
    try {
      await takeScreenshot(urls[i], i, width, height, rotationDegrees, grayscale, bitDepth);
      const rotationNote = rotationDegrees > 0 ? ` (rotated ${rotationDegrees}°)` : '';
      const grayscaleNote = grayscale ? ' (grayscale)' : '';
      const bitDepthNote = bitDepth !== 24 ? ` (${bitDepth}-bit)` : '';
      console.log(`✅ Screenshot ${i}.png completed for: ${urls[i]}${rotationNote}${grayscaleNote}${bitDepthNote}`);
    } catch (error) {
      console.error(`❌ Failed to screenshot ${urls[i]}:`, error.message);
    }
  }
  
  console.log('📸 Screenshot batch completed');
}

/**
 * Initialize the add-on
 */
async function init() {
  console.log('🚀 HA Screenshotter starting up...');
  console.log('📅 Started at:', new Date().toISOString());
  
  try {
  // Ensure www and screenshots directories exist (served at /local/)
  await fs.ensureDir(WWW_PATH);
  await fs.ensureDir(SCREENSHOTS_PATH);
  console.log('✅ WWW directory ensured at:', WWW_PATH);
  console.log('✅ Screenshots directory ensured at:', SCREENSHOTS_PATH);
    
    // Load configuration
    const config = await loadConfiguration();
    console.log('🔧 Configuration loaded:', {
      schedule: config.schedule,
      urls: config.urls,
      urlCount: config.urls.length,
      resolution: `${config.resolution_width}x${config.resolution_height}`,
      rotation: `${config.rotation_degrees}°`,
      grayscale: config.grayscale,
      bitDepth: `${config.bit_depth}-bit`,
      runOnce: config.run_once
    });
    
    // Validate cron schedule
    if (!cron.validate(config.schedule)) {
      throw new Error(`Invalid cron schedule: ${config.schedule}`);
    }
    console.log('✅ Cron schedule is valid:', config.schedule);
    
    // Take initial screenshots
    console.log('📸 Taking initial screenshots...');
    await takeAllScreenshots(config.urls, config.resolution_width, config.resolution_height, config.rotation_degrees, config.grayscale, config.bit_depth);
    
    // Check if we should run once and exit
    if (config.run_once) {
      console.log('✅ Run once mode enabled - screenshots completed');
      console.log('👋 HA Screenshotter exiting gracefully after one cycle...');
      process.exit(0);
    }
    
    // Set up cron scheduler
    console.log(`⏰ Setting up scheduler with pattern: ${config.schedule}`);
    cron.schedule(config.schedule, async () => {
      console.log('⏰ Scheduled screenshot execution started');
      await takeAllScreenshots(config.urls, config.resolution_width, config.resolution_height, config.rotation_degrees, config.grayscale, config.bit_depth);
    });
    
    console.log('🎉 HA Screenshotter configured and scheduled!');
    console.log('✨ Add-on is running successfully');
    
    return config;
    
  } catch (error) {
    console.error('❌ Error during initialization:', error.message);
    process.exit(1);
  }
}

/**
 * Keep the process running
 */
function keepAlive(config) {
  console.log('💭 Add-on is now running and will keep alive...');
  console.log(`📋 Monitoring ${config.urls.length} URL(s) on schedule: ${config.schedule}`);
  
  // Log a heartbeat message every 5 minutes to show the add-on is still running
  setInterval(() => {
    console.log('💓 Heartbeat:', new Date().toISOString(), `- ${config.urls.length} URLs scheduled`);
  }, 5 * 60 * 1000);
}

/**
 * Handle graceful shutdown
 */
function handleShutdown() {
  console.log('🛑 Received shutdown signal');
  console.log('👋 HA Screenshotter shutting down gracefully...');
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);

// Start the application
init()
  .then((config) => keepAlive(config))
  .catch((error) => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });