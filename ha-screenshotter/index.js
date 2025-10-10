#!/usr/bin/env node

/**
 * HA Screenshotter - Home Assistant Add-on
 * Step 2: Basic screenshot functionality
 */

const fs = require('fs-extra');
const path = require('path');
const puppeteer = require('puppeteer');

// Configuration paths (Home Assistant standard paths)
const CONFIG_PATH = '/data/options.json';
const SHARE_PATH = '/share';
const SCREENSHOTS_PATH = path.join(SHARE_PATH, 'screenshots');

/**
 * Take a screenshot of a given URL
 * @param {string} url - The URL to screenshot
 * @param {string} filename - The filename to save the screenshot as
 */
async function takeScreenshot(url, filename) {
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
    await page.setViewport({ width: 1280, height: 720 });
    
    // Navigate to the URL with timeout
    console.log(`🌐 Navigating to: ${url}`);
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    // Wait for the page to be fully loaded
    await page.waitForFunction('document.readyState === "complete"');
    
    // Take the screenshot
    const screenshotPath = path.join(SCREENSHOTS_PATH, filename);
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: false,
      type: 'png'
    });
    
    console.log(`✅ Screenshot saved: ${screenshotPath}`);
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
 * Initialize the add-on
 */
async function init() {
  console.log('🚀 HA Screenshotter starting up...');
  console.log('📅 Started at:', new Date().toISOString());
  
  try {
    // Ensure share and screenshots directories exist
    await fs.ensureDir(SHARE_PATH);
    await fs.ensureDir(SCREENSHOTS_PATH);
    console.log('✅ Share directory ensured at:', SHARE_PATH);
    console.log('✅ Screenshots directory ensured at:', SCREENSHOTS_PATH);
    
    // Log configuration path availability
    const configExists = await fs.pathExists(CONFIG_PATH);
    console.log('⚙️  Configuration file exists:', configExists);
    
    if (configExists) {
      const config = await fs.readJson(CONFIG_PATH);
      console.log('🔧 Configuration loaded:', JSON.stringify(config, null, 2));
    } else {
      console.log('⚠️  No configuration file found, using defaults');
    }
    
    console.log('🎉 Hello World from HA Screenshotter!');
    console.log('✨ Add-on is running successfully');
    
  } catch (error) {
    console.error('❌ Error during initialization:', error.message);
    process.exit(1);
  }
}

/**
 * Keep the process running
 */
function keepAlive() {
  console.log('💭 Add-on is now running and will keep alive...');
  
  // Log a heartbeat message every 5 minutes to show the add-on is still running
  setInterval(() => {
    console.log('💓 Heartbeat:', new Date().toISOString());
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
  .then(keepAlive)
  .catch((error) => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });