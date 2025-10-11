#!/usr/bin/env node

/**
 * HA Screenshotter - Home Assistant Add-on
 * Main entry point that orchestrates the application
 */

const fs = require('fs-extra');
const path = require('path');
const cron = require('node-cron');

// Load package.json for version info
const packageInfo = require('./package.json');

// Import modules
const { WWW_PATH, SCREENSHOTS_PATH } = require('./src/constants');
const { loadConfiguration } = require('./src/config');
const { displaySystemInfo } = require('./src/systemInfo');
const { takeAllScreenshots } = require('./src/screenshotter');
const { setupWebServer } = require('./src/webServer');

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
    
    // Clean up existing screenshots to avoid stale files
    console.log('🧹 Cleaning up existing screenshots...');
    const files = await fs.readdir(SCREENSHOTS_PATH);
    const pngFiles = files.filter(file => file.endsWith('.png'));
    if (pngFiles.length > 0) {
      for (const file of pngFiles) {
        await fs.remove(path.join(SCREENSHOTS_PATH, file));
      }
      console.log(`✅ Deleted ${pngFiles.length} existing screenshot(s)`);
    } else {
      console.log('✅ No existing screenshots to clean up');
    }
    
    // Load configuration
    const config = await loadConfiguration();
    
    // Display comprehensive system information
    displaySystemInfo(packageInfo, config);
    
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
        console.log('🛑 Shutting down container to allow Home Assistant restart...');
        process.exit(1);
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