/**
 * Screenshot capture functionality
 */

const fs = require('fs-extra');
const path = require('path');
const puppeteer = require('puppeteer');
const { SCREENSHOTS_PATH } = require('./constants');
const { rotateImage, convertToGrayscale, cropImage, reduceBitDepth, applyAdvancedProcessing } = require('./imageProcessor');
const { generateChecksumFile } = require('./checksumUtil');
const { addToHistory } = require('./crcHistory');
const { extractVisibleText } = require('./textExtractor');

/**
 * Get user agent string for mobile device presets
 * @param {string} preset - Preset name or custom user agent string
 * @returns {string} User agent string
 */
function getUserAgent(preset) {
  const userAgents = {
    'iPhone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    'iPad': 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    'Android': 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
  };
  
  return userAgents[preset] || preset; // Return preset if it's a custom user agent string
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
 * @param {Object|null} cropConfig - Crop configuration object with x, y, width, height properties
 * @param {string} longLivedToken - Home Assistant long-lived access token
 * @param {string} language - Language setting for Home Assistant frontend
 * @param {string} deviceEmulation - Device emulation preset name or "desktop"/"custom"
 * @param {Object|null} mobileViewport - Custom mobile viewport settings
 * @param {Object|null} advancedProcessing - Advanced processing options (contrast, saturation, gamma, etc.)
 * @param {boolean} useTextBasedCrc32 - If true, use text-based SimHash checksum; if false, use pixel-based CRC32
 */
async function takeScreenshot(url, index, width, height, rotationDegrees = 0, grayscale = false, bitDepth = 24, cropConfig = null, longLivedToken = '', language = 'en', deviceEmulation = 'desktop', mobileViewport = null, advancedProcessing = null, useTextBasedCrc32 = false) {
  let browser = null;
  try {
    // Check if Chromium is available
    if (!fs.existsSync('/usr/bin/chromium-browser')) {
      throw new Error('Chromium browser not found at /usr/bin/chromium-browser');
    }
    
    // Launch Puppeteer with minimal configuration first
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        // Additional stability flags
        '--disable-software-rasterizer',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-breakpad',
        '--disable-component-update',
        '--disable-domain-reliability',
        '--disable-sync',
        '--disable-features=TranslateUI,BlinkGenPropertyTrees',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-pings',
        '--no-zygote'
      ]
    });

    const page = await browser.newPage();
    
    // Apply device emulation if configured
    if (deviceEmulation && deviceEmulation !== 'desktop') {
      console.log(`   │       📱 Emulating device: ${deviceEmulation}`);
      
      if (deviceEmulation === 'custom') {
        // Use custom mobile viewport settings
        if (mobileViewport) {
          const viewportConfig = {
            width: width, // Always use configured resolution, not mobileViewport dimensions
            height: height, // Always use configured resolution, not mobileViewport dimensions
            deviceScaleFactor: 1, // Always 1 to prevent scaling up the screenshot
            isMobile: true,
            hasTouch: mobileViewport.touch_enabled !== undefined ? mobileViewport.touch_enabled : true,
            isLandscape: mobileViewport.is_landscape || false
          };
          
          console.log(`   │       📐 Custom viewport: ${width}x${height} with mobile settings (no scaling)`);
          await page.setViewport(viewportConfig);
          
          // Set custom user agent if provided
          if (mobileViewport.user_agent) {
            const userAgent = getUserAgent(mobileViewport.user_agent);
            console.log(`   │       🔧 User agent: ${mobileViewport.user_agent}`);
            await page.setUserAgent(userAgent);
          }
        } else {
          console.log(`   │       ⚠️  Custom device emulation requested but no mobile_viewport provided, using desktop mode`);
          await page.setViewport({ width: width, height: height });
        }
      } else {
        // Use Puppeteer built-in device preset
        const device = puppeteer.devices[deviceEmulation];
        if (device) {
          console.log(`   │       📱 Using device preset: ${deviceEmulation} with ${width}x${height} viewport`);
          // Set viewport to our configured resolution, not the device's native resolution
          // Force deviceScaleFactor to 1 to ensure screenshot matches exact configured dimensions
          await page.setViewport({ 
            width: width, 
            height: height,
            deviceScaleFactor: 1, // Always 1 to prevent scaling up the screenshot
            isMobile: device.viewport.isMobile || true,
            hasTouch: device.viewport.hasTouch || true,
            isLandscape: device.viewport.isLandscape || false
          });
          // Set the user agent for mobile behavior without changing viewport dimensions
          await page.setUserAgent(device.userAgent);
        } else {
          console.log(`   │       ⚠️  Unknown device preset: ${deviceEmulation}, using desktop mode`);
          await page.setViewport({ width: width, height: height });
        }
      }
    } else {
      // Default desktop behavior (current implementation)
      await page.setViewport({ width: width, height: height });
    }
    
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
    await page.waitForFunction('document.readyState === "complete"');
    
    // Extract visible text if text-based checksum is enabled
    let extractedText = '';
    if (useTextBasedCrc32) {
      console.log('   │       📝 Extracting visible text for SimHash checksum...');
      try {
        // Use the enhanced text extraction utility
        extractedText = await extractVisibleText(page, {
          waitForHA: true,
          maxWaitTime: 10000,
          debugLogging: true
        });
        
        // Log results
        const charCount = extractedText ? extractedText.length : 0;
        const textPreview = extractedText ? extractedText.substring(0, 100).replace(/\n/g, ' ') : '(empty)';
        
        if (!extractedText || extractedText.trim().length === 0) {
          console.log(`   │       ⚠️  No visible text found on page`);
          console.log(`   │       💡 Debug: Extracted text length: ${charCount}, preview: "${textPreview}"`);
          console.log(`   │       💡 Tip: Page might be canvas-based, image-only, or require additional wait time`);
          console.log(`   │       💡 Solution: Check if page has visible text content and renders correctly`);
          extractedText = '';
        } else {
          console.log(`   │       ✅ Extracted ${charCount} characters of visible text`);
          console.log(`   │       📄 Text preview: "${textPreview}..."`);
        }
      } catch (error) {
        console.log(`   │       ⚠️  Failed to extract text: ${error.message}`);
        console.log(`   │       💡 Possible causes: Page not accessible, requires auth, or JS execution blocked`);
        console.log(`   │       💡 Solution: Verify page loads correctly and is not blocked by CSP`);
        extractedText = '';
      }
    }
    // Take the screenshot to a temporary file to prevent race conditions
    console.log('   │       📷 Taking screenshot...');
    const finalFilename = `${index}.png`;
    const tempFilename = `${index}_temp.png`;
    let screenshotPath = path.join(SCREENSHOTS_PATH, tempFilename);
    const finalPath = path.join(SCREENSHOTS_PATH, finalFilename);
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: false,
      type: 'png'
    });
    
    // Log public URL for Home Assistant (served at /media/ha-screenshotter/)
    const publicUrl = `/media/ha-screenshotter/${finalFilename}`;
    console.log(`   │       🌐 Home Assistant URL: ${publicUrl}`);
    
    // Apply cropping if needed (BEFORE rotation - crop coordinates are relative to original image)
    if (cropConfig !== null && cropConfig !== false) {
      await cropImage(screenshotPath, cropConfig, '   │       ');
    }
    
    // Apply advanced processing if needed (AFTER cropping, BEFORE rotation)
    if (advancedProcessing !== null && advancedProcessing !== false) {
      await applyAdvancedProcessing(screenshotPath, advancedProcessing, '   │       ');
    }
    
    // Apply rotation if needed (AFTER cropping and processing - rotate the processed image)
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
    
    // Atomically move the processed screenshot to its final location
    await fs.move(screenshotPath, finalPath, { overwrite: true });
    console.log(`   │       ✅ Screenshot finalized: ${finalFilename}`);
    
    // Generate checksum file after screenshot is finalized (use appropriate method based on config)
    const checksum = await generateChecksumFile(finalPath, useTextBasedCrc32, extractedText, '   │       ');
    
    // Add checksum to history
    if (checksum) {
      await addToHistory(index, checksum);
    }
    
    return finalPath;
    
  } catch (error) {
    console.error(`❌ Error taking screenshot of ${url}:`, error.message);
    
    // Clean up temporary file if it exists
    try {
      const tempFilename = `${index}_temp.png`;
      const tempPath = path.join(SCREENSHOTS_PATH, tempFilename);
      if (await fs.pathExists(tempPath)) {
        await fs.remove(tempPath);
        console.log(`   │       🧹 Cleaned up temporary file: ${tempFilename}`);
      }
    } catch (cleanupError) {
      console.error(`   │       ⚠️  Failed to clean up temporary file:`, cleanupError.message);
    }
    
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
    const deviceText = urlConfig.device_emulation && urlConfig.device_emulation !== 'desktop' ? ` [${urlConfig.device_emulation}]` : '';
    const checksumText = urlConfig.use_text_based_crc32 ? ' [text-based checksum]' : '';
    
    console.log(`   │ 📸 [${urlNum}/${urls.length}] Processing: ${urlConfig.url}`);
    console.log(`   │       📐 Resolution: ${urlConfig.width}x${urlConfig.height}${rotationText}${cropText}${grayscaleText}${bitDepthText}${deviceText}${checksumText}`);
    
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
        language,
        urlConfig.device_emulation,
        urlConfig.mobile_viewport,
        urlConfig.advanced_processing,
        urlConfig.use_text_based_crc32
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
