/**
 * System information display
 */

const { CONFIG_PATH, WWW_PATH, SCREENSHOTS_PATH } = require('./constants');

/**
 * Display comprehensive system information including version and configuration
 * @param {Object} packageInfo - The package.json object
 * @param {Object} config - The configuration object to display
 */
function displaySystemInfo(packageInfo, config = null) {
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

module.exports = {
  displaySystemInfo
};
