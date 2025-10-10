#!/usr/bin/env node

/**
 * HA Screenshotter - Home Assistant Add-on
 * Step 2: Basic screenshot functionality
 */

const fs = require('fs-extra');
const path = require('path');
const puppeteer = require('puppeteer');
const cron = require('node-cron');

// Configuration paths (Home Assistant standard paths)
const CONFIG_PATH = '/data/options.json';
const SHARE_PATH = '/share';
const SCREENSHOTS_PATH = path.join(SHARE_PATH, 'screenshots');

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
    ]
  };
  
  try {
    const configExists = await fs.pathExists(CONFIG_PATH);
    if (configExists) {
      const config = await fs.readJson(CONFIG_PATH);
      return {
        schedule: config.schedule || defaultConfig.schedule,
        urls: config.urls || defaultConfig.urls
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
 */
async function takeScreenshot(url, index) {
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
    const filename = `${index}.jpg`;
    const screenshotPath = path.join(SCREENSHOTS_PATH, filename);
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: false,
      type: 'jpeg',
      quality: 90
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
 * Take screenshots of all configured URLs
 * @param {Array} urls - Array of URLs to screenshot
 */
async function takeAllScreenshots(urls) {
  console.log(`📸 Taking screenshots of ${urls.length} URL(s)...`);
  
  for (let i = 0; i < urls.length; i++) {
    try {
      await takeScreenshot(urls[i], i);
      console.log(`✅ Screenshot ${i}.jpg completed for: ${urls[i]}`);
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
    // Ensure share and screenshots directories exist
    await fs.ensureDir(SHARE_PATH);
    await fs.ensureDir(SCREENSHOTS_PATH);
    console.log('✅ Share directory ensured at:', SHARE_PATH);
    console.log('✅ Screenshots directory ensured at:', SCREENSHOTS_PATH);
    
    // Load configuration
    const config = await loadConfiguration();
    console.log('🔧 Configuration loaded:', {
      schedule: config.schedule,
      urls: config.urls,
      urlCount: config.urls.length
    });
    
    // Validate cron schedule
    if (!cron.validate(config.schedule)) {
      throw new Error(`Invalid cron schedule: ${config.schedule}`);
    }
    console.log('✅ Cron schedule is valid:', config.schedule);
    
    // Take initial screenshots
    console.log('📸 Taking initial screenshots...');
    await takeAllScreenshots(config.urls);
    
    // Set up cron scheduler
    console.log(`⏰ Setting up scheduler with pattern: ${config.schedule}`);
    cron.schedule(config.schedule, async () => {
      console.log('⏰ Scheduled screenshot execution started');
      await takeAllScreenshots(config.urls);
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