#!/usr/bin/env node

/**
 * HA Screenshotter - Home Assistant Add-on
 * A simple "Hello World" implementation for Step 1
 */

const fs = require('fs-extra');
const path = require('path');

// Configuration paths (Home Assistant standard paths)
const CONFIG_PATH = '/data/options.json';
const SHARE_PATH = '/share';

/**
 * Initialize the add-on
 */
async function init() {
  console.log('🚀 HA Screenshotter starting up...');
  console.log('📅 Started at:', new Date().toISOString());
  
  try {
    // Ensure share directory exists
    await fs.ensureDir(SHARE_PATH);
    console.log('✅ Share directory ensured at:', SHARE_PATH);
    
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