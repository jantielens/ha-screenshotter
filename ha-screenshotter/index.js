#!/usr/bin/env node

/**
 * HA Screenshotter - Home Assistant Add-on
 */

const fs = require('fs-extra');
const path = require('path');
const puppeteer = require('puppeteer');
const cron = require('node-cron');
const Jimp = require('jimp');
const sharp = require('sharp');
const express = require('express');

// Load package.json for version info
const packageInfo = require('./package.json');

// Configuration paths (Home Assistant standard paths)
const CONFIG_PATH = '/data/options.json';
// Write screenshots to the Home Assistant media folder so files are available at /media/
const WWW_PATH = '/media';
const SCREENSHOTS_PATH = path.join(WWW_PATH, 'ha-screenshotter');

/**
 * Rotate an image by specified degrees
 * @param {string} imagePath - Path to the image file
 * @param {number} degrees - Rotation degrees (0, 90, 180, 270)
 * @param {string} indent - Indentation prefix for logging
 */
async function rotateImage(imagePath, degrees, indent = '') {
  if (degrees === 0) {
    return; // No rotation needed
  }
  
  try {
    console.log(`${indent}🔄 Rotating image ${degrees}°...`);
    const image = await Jimp.read(imagePath);
    await image.rotate(degrees).writeAsync(imagePath);
    console.log(`${indent}✅ Image rotated successfully`);
  } catch (error) {
    console.error(`${indent}❌ Error rotating image:`, error.message);
    throw error;
  }
}

/**
 * Convert an image to grayscale
 * @param {string} imagePath - Path to the image file
 * @param {string} indent - Indentation prefix for logging
 */
async function convertToGrayscale(imagePath, indent = '') {
  try {
    console.log(`${indent}🎨 Converting to grayscale...`);
    const image = await Jimp.read(imagePath);
    await image.greyscale().writeAsync(imagePath);
    console.log(`${indent}✅ Grayscale conversion completed`);
  } catch (error) {
    console.error(`${indent}❌ Error converting to grayscale:`, error.message);
    throw error;
  }
}

/**
 * Reduce image bit depth using Sharp - processes PNG files for true bit depth control
 * @param {string} imagePath - Path to the PNG image file
 * @param {number} bitDepth - Target bit depth (1, 4, 8, 16, 24)
 * @param {string} indent - Indentation prefix for logging
 */
async function reduceBitDepth(imagePath, bitDepth, indent = '') {
  if (bitDepth === 24) {
    return; // No reduction needed for 24-bit
  }
  
  try {
    console.log(`${indent}🎨 Reducing bit depth to ${bitDepth}-bit...`);
    
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
    console.log(`${indent}✅ Bit depth reduced to ${bitDepth}-bit successfully`);
    
  } catch (error) {
    console.error(`${indent}❌ Error reducing bit depth:`, error.message);
    // If bit depth reduction fails, just log the error but don't crash
    console.log(`${indent}⚠️  Continuing without bit depth reduction`);
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

/**
 * Clean up existing screenshots from the screenshots directory
 * This prevents old screenshots from persisting after URL configuration changes
 */
async function cleanupExistingScreenshots() {
  try {
    const files = await fs.readdir(SCREENSHOTS_PATH);
    const screenshotFiles = files.filter(file => file.endsWith('.png'));
    
    if (screenshotFiles.length === 0) {
      console.log('🧹 No existing screenshots to clean up');
      return;
    }
    
    console.log(`🧹 Cleaning up ${screenshotFiles.length} existing screenshot(s)...`);
    
    for (const file of screenshotFiles) {
      const filePath = path.join(SCREENSHOTS_PATH, file);
      await fs.remove(filePath);
      console.log(`   ✅ Deleted: ${file}`);
    }
    
    console.log(`✅ Cleanup complete: ${screenshotFiles.length} file(s) removed`);
  } catch (error) {
    console.error('⚠️  Error during screenshot cleanup:', error.message);
    // Don't throw error, just log it - cleanup failure shouldn't prevent startup
  }
}

/**
 * Display comprehensive system information including version and configuration
 * @param {Object} config - The configuration object to display
 */
function displaySystemInfo(config = null) {
  console.log('');
  console.log('═'.repeat(80));
  console.log('🖥️  SYSTEM INFORMATION');
  console.log('═'.repeat(80));
  
  // Version and package info
  console.log('📦 Application Info:');
  console.log(`   • Name: ${packageInfo.name}`);
  console.log(`   • Version: ${packageInfo.version}`);
  console.log(`   • Description: ${packageInfo.description}`);
  console.log(`   • Author: ${packageInfo.author}`);
  
  // Try to get git information if available (development builds)
  try {
    const { execSync } = require('child_process');
    const gitBranch = execSync('git rev-parse --abbrev-ref HEAD 2>/dev/null', { encoding: 'utf8' }).trim();
    const gitCommit = execSync('git rev-parse --short HEAD 2>/dev/null', { encoding: 'utf8' }).trim();
    if (gitBranch && gitCommit) {
      console.log(`   • Git Branch: ${gitBranch}`);
      console.log(`   • Git Commit: ${gitCommit}`);
    }
  } catch (error) {
    // Git info not available (likely in production Docker container)
  }
  console.log('');
  
  // System environment
  console.log('🔧 System Environment:');
  console.log(`   • Platform: ${process.platform}`);
  console.log(`   • Architecture: ${process.arch}`);
  console.log(`   • Node.js Version: ${process.version}`);
  console.log(`   • Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  console.log(`   • Process ID: ${process.pid}`);
  console.log(`   • Started: ${new Date().toISOString()}`);
  console.log('');
  
  // Configuration details (if provided)
  if (config) {
    console.log('⚙️  Configuration:');
    console.log(`   • Schedule: ${config.schedule}`);
    console.log(`   • URL Count: ${config.urls.length}`);
    console.log(`   • Resolution: ${config.resolution_width}x${config.resolution_height}`);
    console.log(`   • Rotation: ${config.rotation_degrees}°`);
    console.log(`   • Grayscale: ${config.grayscale ? 'enabled' : 'disabled'}`);
    console.log(`   • Bit Depth: ${config.bit_depth}-bit`);
    console.log(`   • Run Once: ${config.run_once ? 'enabled' : 'disabled'}`);
    console.log(`   • Web Server Port: ${config.webserverport > 0 ? config.webserverport : 'disabled'}`);
    console.log('');
    
    console.log('🌐 URLs to Screenshot:');
    config.urls.forEach((url, index) => {
      console.log(`   ${index + 1}. ${url}`);
    });
    console.log('');
    
    console.log('📂 Paths:');
    console.log(`   • Config Path: ${CONFIG_PATH}`);
    console.log(`   • WWW Path: ${WWW_PATH}`);
    console.log(`   • Screenshots Path: ${SCREENSHOTS_PATH}`);
    console.log('');
  }
  
  // Dependencies
  console.log('📚 Dependencies:');
  Object.entries(packageInfo.dependencies).forEach(([name, version]) => {
    console.log(`   • ${name}: ${version}`);
  });
  
  console.log('═'.repeat(80));
  console.log('');
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
  let browser = null;
  try {
    // Check if Chromium is available
    const fs = require('fs');
    if (!fs.existsSync('/usr/bin/chromium-browser')) {
      throw new Error('Chromium browser not found at /usr/bin/chromium-browser');
    }
    console.log('   │       🔍 Chromium browser found');
    
    // Log basic runtime info
    console.log(`   │       💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    
    // Launch Puppeteer with minimal configuration first
    console.log('   │       🚀 Launching browser...');
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
    
    console.log('   │       ✅ Browser launched successfully');

    const page = await browser.newPage();
    
    // Set viewport size for consistent screenshots
    console.log(`   │       📐 Setting viewport to ${width}x${height}`);
    await page.setViewport({ width: width, height: height });
    
    // Navigate to the URL with timeout
    console.log(`   │       🌐 Navigating to URL...`);
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    // Wait for the page to be fully loaded
    console.log('   │       ⏳ Waiting for page to fully load...');
    await page.waitForFunction('document.readyState === "complete"');
    
    // Take the screenshot
    console.log('   │       📷 Taking screenshot...');
    const filename = `${index}.png`;
    let screenshotPath = path.join(SCREENSHOTS_PATH, filename);
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: false,
      type: 'png'
    });
    
  console.log(`   │       💾 Screenshot saved to: ${filename}`);
  // Log public URL for Home Assistant (served at /media/ha-screenshotter/)
  const publicUrl = `/media/ha-screenshotter/${filename}`;
  console.log(`   │       🌐 Home Assistant URL: ${publicUrl}`);
    
    // Apply rotation if needed
    if (rotationDegrees !== 0) {
      await rotateImage(screenshotPath, rotationDegrees, '   │       ');
    }
    
    // Apply grayscale conversion if needed
    if (grayscale) {
      await convertToGrayscale(screenshotPath, '   │       ');
    }
    
    // Apply bit depth reduction if needed
    if (bitDepth !== 24) {
      await reduceBitDepth(screenshotPath, bitDepth, '   │       ');
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
  
  console.log(`📸 Starting screenshot batch: ${urls.length} URL(s) at ${width}x${height}${rotationText}${grayscaleText}${bitDepthText}`);
  console.log('   ┌─────────────────────────────────────────────────────────────┐');
  
  let successCount = 0;
  let failureCount = 0;
  
  for (let i = 0; i < urls.length; i++) {
    const urlNum = i + 1;
    console.log(`   │ 📸 [${urlNum}/${urls.length}] Processing: ${urls[i]}`);
    
    try {
      await takeScreenshot(urls[i], i, width, height, rotationDegrees, grayscale, bitDepth);
      const rotationNote = rotationDegrees > 0 ? ` (rotated ${rotationDegrees}°)` : '';
      const grayscaleNote = grayscale ? ' (grayscale)' : '';
      const bitDepthNote = bitDepth !== 24 ? ` (${bitDepth}-bit)` : '';
      console.log(`   │    ✅ Screenshot ${i}.png saved${rotationNote}${grayscaleNote}${bitDepthNote}`);
      successCount++;
    } catch (error) {
      console.log(`   │    ❌ Failed: ${error.message}`);
      failureCount++;
    }
    
    // Add a separator between URLs (except for the last one)
    if (i < urls.length - 1) {
      console.log('   │');
    }
  }
  
  console.log('   └─────────────────────────────────────────────────────────────┘');
  console.log(`📊 Batch completed: ${successCount} successful, ${failureCount} failed`);
}

/**
 * Set up a basic web server to serve screenshots
 */
function setupWebServer(config) {
  const app = express();
  const PORT = config.webserverport;
  
  // Serve static files from the screenshots directory
  app.use('/screenshots', express.static(SCREENSHOTS_PATH));
  
  // Main page with a simple gallery view
  app.get('/', async (req, res) => {
    try {
      // Read all screenshot files
      const files = await fs.readdir(SCREENSHOTS_PATH);
      const imageFiles = files.filter(file => file.endsWith('.png')).sort();
      
      // Generate HTML page
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HA Screenshotter Gallery</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .info {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        .screenshot-card {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        .screenshot-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .screenshot-card img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            cursor: pointer;
        }
        .screenshot-info {
            padding: 15px;
        }
        .screenshot-name {
            font-weight: 600;
            color: #333;
            margin-bottom: 5px;
        }
        .screenshot-time {
            color: #666;
            font-size: 0.9em;
        }

        .refresh-btn {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px 0;
        }
        .refresh-btn:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📸 HA Screenshotter Gallery</h1>
        <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
    </div>
    
    <div class="info">
        <h3>Configuration</h3>
        <p><strong>Schedule:</strong> ${config.schedule}</p>
        <p><strong>URLs:</strong> ${config.urls.length} configured</p>
        <p><strong>Resolution:</strong> ${config.resolution_width}x${config.resolution_height}</p>
        <p><strong>Last Update:</strong> ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="gallery">
        ${imageFiles.map((file, index) => `
            <div class="screenshot-card">
                <img src="/screenshots/${file}" alt="Screenshot ${index + 1}" onclick="window.open('/screenshots/${file}', '_blank')">
                <div class="screenshot-info">
                    <div class="screenshot-name">Screenshot ${index + 1}</div>
                    <div class="screenshot-time">File: ${file}</div>
                </div>
            </div>
        `).join('')}
    </div>
    
    ${imageFiles.length === 0 ? '<p style="text-align: center; color: #666; font-size: 1.2em;">No screenshots found. Screenshots will appear here once they are generated.</p>' : ''}
    
    <script>
        // Auto-refresh every 60 seconds
        setInterval(() => {
            location.reload();
        }, 60000);
    </script>
</body>
</html>`;
      
      res.send(html);
    } catch (error) {
      console.error('❌ Error serving web page:', error.message);
      res.status(500).send('Error loading screenshots');
    }
  });
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      screenshots_path: SCREENSHOTS_PATH,
      config: {
        schedule: config.schedule,
        url_count: config.urls.length,
        resolution: `${config.resolution_width}x${config.resolution_height}`
      }
    });
  });
  
  // Start the server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Web server started on port ${PORT}`);
    console.log(`📱 Access the gallery at: http://localhost:${PORT}`);
    console.log(`🏥 Health check available at: http://localhost:${PORT}/health`);
  });
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
  console.log('✅ Media directory ensured at:', WWW_PATH);
  console.log('✅ Screenshots directory ensured at:', SCREENSHOTS_PATH);
    
    // Load configuration
    const config = await loadConfiguration();
    
    // Display comprehensive system information
    displaySystemInfo(config);
    
    // Validate cron schedule
    if (!cron.validate(config.schedule)) {
      throw new Error(`Invalid cron schedule: ${config.schedule}`);
    }
    console.log('✅ Cron schedule is valid:', config.schedule);
    
    // Clean up existing screenshots before taking new ones
    await cleanupExistingScreenshots();
    
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
      const startTime = new Date();
      console.log('');
      console.log('┌─────────────────────────────────────────────────────────────┐');
      console.log('│                  🕐 SCHEDULED EXECUTION START                 │');
      console.log('└─────────────────────────────────────────────────────────────┘');
      console.log(`⏰ Started at: ${startTime.toISOString()}`);
      console.log(`📋 Processing ${config.urls.length} URL(s)`);
      console.log('');
      
      try {
        await takeAllScreenshots(config.urls, config.resolution_width, config.resolution_height, config.rotation_degrees, config.grayscale, config.bit_depth);
        
        const endTime = new Date();
        const duration = Math.round((endTime - startTime) / 1000);
        console.log('');
        console.log('┌─────────────────────────────────────────────────────────────┐');
        console.log('│                  ✅ SCHEDULED EXECUTION COMPLETE              │');
        console.log('└─────────────────────────────────────────────────────────────┘');
        console.log(`⏰ Completed at: ${endTime.toISOString()}`);
        console.log(`⚡ Duration: ${duration} seconds`);
        console.log(`📊 Successfully processed ${config.urls.length} URL(s)`);
        console.log('');
      } catch (error) {
        const endTime = new Date();
        const duration = Math.round((endTime - startTime) / 1000);
        console.log('');
        console.log('┌─────────────────────────────────────────────────────────────┐');
        console.log('│                   ❌ SCHEDULED EXECUTION FAILED               │');
        console.log('└─────────────────────────────────────────────────────────────┘');
        console.log(`⏰ Failed at: ${endTime.toISOString()}`);
        console.log(`⚡ Duration: ${duration} seconds`);
        console.log(`❌ Error: ${error.message}`);
        console.log('');
      }
    });
    
    // Set up web server if port is configured
    if (config.webserverport > 0) {
      setupWebServer(config);
    } else {
      console.log('🌐 Web server disabled (webserverport = 0)');
    }
    
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