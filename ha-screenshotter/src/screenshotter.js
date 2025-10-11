/**
 * Screenshot capture functionality
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { SCREENSHOTS_PATH } = require('./constants');
const { rotateImage, convertToGrayscale, reduceBitDepth } = require('./imageProcessor');

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
async function takeScreenshot(url, index, width, height, rotationDegrees = 0, grayscale = false, bitDepth = 24, longLivedToken = '') {
  let browser = null;
  try {
    // Check if Chromium is available
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
    // If a Home Assistant long-lived access token is provided, try to ensure it's applied to all requests
    if (longLivedToken && typeof longLivedToken === 'string' && longLivedToken.length > 0) {
      console.log('   │       🔐 Using provided long-lived access token for authentication');
      // First, set extra HTTP headers (works for normal HTTP requests)
      await page.setExtraHTTPHeaders({
        'Authorization': `Bearer ${longLivedToken}`
      });

      // Additionally, enable request interception and attach the header to all requests including websocket handshake
      try {
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          try {
            const headers = Object.assign({}, req.headers(), {
              'Authorization': `Bearer ${longLivedToken}`
            });
            // Continue the request with modified headers
            req.continue({ headers });
          } catch (e) {
            // If something goes wrong, just continue without modification
            req.continue();
          }
        });

        // Log requests for debugging
        page.on('request', (req) => {
          console.log(`   │       🔁 Request: ${req.method()} ${req.url()} [headers: ${JSON.stringify(req.headers())}]`);
        });
      } catch (e) {
        console.log('   │       ⚠️ Failed to enable request interception:', e.message);
      }
    }
    
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
async function takeAllScreenshots(urls, width, height, rotationDegrees = 0, grayscale = false, bitDepth = 24, longLivedToken = '') {
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
  await takeScreenshot(urls[i], i, width, height, rotationDegrees, grayscale, bitDepth, longLivedToken);
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
  
  // Throw error if any screenshots failed
  if (failureCount > 0) {
    throw new Error(`Screenshot batch failed: ${failureCount} out of ${urls.length} screenshots failed`);
  }
}

module.exports = {
  takeScreenshot,
  takeAllScreenshots
};
