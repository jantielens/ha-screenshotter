/**
 * Image processing functions for rotation, grayscale, and bit depth reduction
 */

const fs = require('fs-extra');
const Jimp = require('jimp');
const sharp = require('sharp');

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

module.exports = {
  rotateImage,
  convertToGrayscale,
  reduceBitDepth
};
