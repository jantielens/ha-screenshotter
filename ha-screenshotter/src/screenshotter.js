/**
 * Screenshot capture functionality
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { SCREENSHOTS_PATH } = require('./constants');
const { rotateImage, convertToGrayscale, cropImage, reduceBitDepth } = require('./imageProcessor');

/**
 * Take a screenshot of a given URL
 * @param {string} url - The URL to screenshot
 * @param {number} index - The index of the URL (used for filename)
 * @param {number} width - The viewport width for the screenshot
 * @param {number} height - The viewport height for the screenshot
 * @param {number} rotationDegrees - Degrees to rotate the screenshot (0, 90, 180, 270)
 * @param {boolean} grayscale - Whether to convert the screenshot to grayscale
 * @param {number} bitDepth - Target bit depth (1, 4, 8, 16, 24)
 * @param {Object|null} cropConfig - Crop configuration object with x, y, width, height properties
 * @param {string} longLivedToken - Home Assistant long-lived access token
 * @param {string} language - Language setting for Home Assistant frontend
 */
async function takeScreenshot(url, index, width, height, rotationDegrees = 0, grayscale = false, bitDepth = 24, cropConfig = null, longLivedToken = '', language = 'en') {
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
    
    // Set viewport size early for consistent screenshots
    console.log(`   │       📐 Setting viewport to ${width}x${height}`);
    await page.setViewport({ width: width, height: height });
    
    // If a Home Assistant long-lived access token is provided, inject it into localStorage
    // for the Home Assistant origin so the frontend (and websockets) will pick it up.
    if (longLivedToken && typeof longLivedToken === 'string' && longLivedToken.length > 0) {
      try {
        console.log('   │       🔐 Using provided long-lived access token for authentication (injecting into localStorage)');
        // Derive the base origin from the target URL so we can set localStorage for that origin
        const origin = new URL(url).origin;
        
        // Navigate to the origin to get same-origin access to localStorage
        // Wait for network to be idle to ensure page is stable before injecting localStorage
        await page.goto(origin, { waitUntil: 'networkidle0', timeout: 15000 });

        const hassTokens = {
          hassUrl: origin,
          access_token: longLivedToken,
          token_type: 'Bearer'
        };

        // Inject the tokens and configured language into localStorage for the origin
        // Use a more robust approach with waitForFunction to ensure page is ready
        await page.waitForFunction(() => document.readyState === 'complete', { timeout: 5000 }).catch(() => {});
        
        await page.evaluate((tokens, selectedLanguage) => {
          try {
            localStorage.setItem('hassTokens', tokens);
            localStorage.setItem('selectedLanguage', selectedLanguage);
          } catch (e) {
            // Ignore storage errors
            // eslint-disable-next-line no-console
            console.warn('   │       ⚠️ Could not set localStorage for authentication:', e && e.message ? e.message : e);
          }
        }, JSON.stringify(hassTokens), JSON.stringify(language));

        // Also set extra HTTP headers as a best-effort fallback for regular HTTP requests
        await page.setExtraHTTPHeaders({
          'Authorization': `Bearer ${longLivedToken}`
        });
      } catch (e) {
        console.log('   │       ⚠️ Failed to inject token into localStorage:', e.message);
      }
    }
    
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
    
    // Apply cropping if needed (BEFORE rotation - crop coordinates are relative to original image)
    if (cropConfig !== null && cropConfig !== false) {
      await cropImage(screenshotPath, cropConfig, '   │       ');
    }
    
    // Apply rotation if needed (AFTER cropping - rotate the cropped image)
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
 * @param {Array} urls - Array of URL configuration objects with individual settings
 * @param {string} longLivedToken - Home Assistant long-lived access token
 * @param {string} language - Language setting for Home Assistant frontend
 */
async function takeAllScreenshots(urls, longLivedToken = '', language = 'en') {
  console.log(`📸 Starting screenshot batch: ${urls.length} URL(s) with individual settings`);
  console.log('   ┌─────────────────────────────────────────────────────────────┐');
  
  let successCount = 0;
  let failureCount = 0;
  
  for (let i = 0; i < urls.length; i++) {
    const urlConfig = urls[i];
    const urlNum = i + 1;
    
    const rotationText = urlConfig.rotation > 0 ? ` with ${urlConfig.rotation}° rotation` : '';
    const cropText = urlConfig.crop ? ` cropped to (${urlConfig.crop.x},${urlConfig.crop.y}) ${urlConfig.crop.width}x${urlConfig.crop.height}` : '';
    const grayscaleText = urlConfig.grayscale ? ' in grayscale' : '';
    const bitDepthText = urlConfig.bit_depth !== 24 ? ` at ${urlConfig.bit_depth}-bit depth` : '';
    
    console.log(`   │ 📸 [${urlNum}/${urls.length}] Processing: ${urlConfig.url}`);
    console.log(`   │       📐 Resolution: ${urlConfig.width}x${urlConfig.height}${rotationText}${cropText}${grayscaleText}${bitDepthText}`);
    
    try {
      await takeScreenshot(
        urlConfig.url, 
        i, 
        urlConfig.width, 
        urlConfig.height, 
        urlConfig.rotation, 
        urlConfig.grayscale, 
        urlConfig.bit_depth, 
        urlConfig.crop,
        longLivedToken, 
        language
      );
      
      const rotationNote = urlConfig.rotation > 0 ? ` (rotated ${urlConfig.rotation}°)` : '';
      const cropNote = urlConfig.crop ? ` (cropped ${urlConfig.crop.width}x${urlConfig.crop.height})` : '';
      const grayscaleNote = urlConfig.grayscale ? ' (grayscale)' : '';
      const bitDepthNote = urlConfig.bit_depth !== 24 ? ` (${urlConfig.bit_depth}-bit)` : '';
      console.log(`   │    ✅ Screenshot ${i}.png saved${rotationNote}${cropNote}${grayscaleNote}${bitDepthNote}`);
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
