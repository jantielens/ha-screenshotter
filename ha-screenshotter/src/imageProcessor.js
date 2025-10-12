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
 * Crop an image to specified dimensions and coordinates
 * @param {string} imagePath - Path to the image file
 * @param {Object} cropConfig - Crop configuration object
 * @param {number} cropConfig.x - X coordinate of the top-left corner (0-based)
 * @param {number} cropConfig.y - Y coordinate of the top-left corner (0-based)
 * @param {number} cropConfig.width - Width of the crop area
 * @param {number} cropConfig.height - Height of the crop area
 * @param {string} indent - Indentation prefix for logging
 */
async function cropImage(imagePath, cropConfig, indent = '') {
  try {
    console.log(`${indent}✂️  Cropping image (${cropConfig.x}, ${cropConfig.y}) ${cropConfig.width}x${cropConfig.height}...`);
    
    // First get the original image dimensions to validate crop area
    const metadata = await sharp(imagePath).metadata();
    const originalWidth = metadata.width;
    const originalHeight = metadata.height;
    
    // Validate crop parameters
    if (cropConfig.x < 0 || cropConfig.y < 0) {
      throw new Error(`Crop coordinates must be non-negative (got x:${cropConfig.x}, y:${cropConfig.y})`);
    }
    
    if (cropConfig.x + cropConfig.width > originalWidth || cropConfig.y + cropConfig.height > originalHeight) {
      throw new Error(`Crop area (${cropConfig.x + cropConfig.width}, ${cropConfig.y + cropConfig.height}) exceeds image dimensions (${originalWidth}x${originalHeight})`);
    }
    
    if (cropConfig.width <= 0 || cropConfig.height <= 0) {
      throw new Error(`Crop dimensions must be positive (got width:${cropConfig.width}, height:${cropConfig.height})`);
    }
    
    // Perform the crop operation
    const croppedBuffer = await sharp(imagePath)
      .extract({
        left: cropConfig.x,
        top: cropConfig.y,
        width: cropConfig.width,
        height: cropConfig.height
      })
      .png()
      .toBuffer();
    
    // Write the cropped buffer back to the original file
    await fs.writeFile(imagePath, croppedBuffer);
    console.log(`${indent}✅ Image cropped successfully from ${originalWidth}x${originalHeight} to ${cropConfig.width}x${cropConfig.height}`);
    
  } catch (error) {
    console.error(`${indent}❌ Error cropping image:`, error.message);
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
  cropImage,
  reduceBitDepth
};
