#!/usr/bin/env node
/**
 * Test script to verify pixel-based checksum implementation
 * This tests that:
 * 1. Identical pixels produce identical checksums
 * 2. Different pixels produce different checksums
 * 3. Checksum is stable across re-encoding of same pixels
 */

const fs = require('fs-extra');
const path = require('path');
const sharp = require('sharp');

// Import the checksum utility
const { calculatePixelChecksum } = require('./src/checksumUtil.js');

async function runTests() {
  console.log('🧪 Testing pixel-based checksum implementation\n');
  
  const testDir = '/tmp/checksum-test';
  await fs.ensureDir(testDir);
  
  try {
    // Test 1: Create a simple test image
    console.log('Test 1: Creating test image and calculating checksum...');
    const testImage1 = path.join(testDir, 'test1.png');
    await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    }).png().toFile(testImage1);
    
    const checksum1 = await calculatePixelChecksum(testImage1);
    console.log(`  ✅ Checksum for test1.png: ${checksum1}`);
    
    // Test 2: Re-encode the same image and verify checksum matches
    console.log('\nTest 2: Re-encoding same pixels and verifying checksum stability...');
    const testImage2 = path.join(testDir, 'test2.png');
    const buffer = await sharp(testImage1).png({ compressionLevel: 9 }).toBuffer();
    await fs.writeFile(testImage2, buffer);
    
    const checksum2 = await calculatePixelChecksum(testImage2);
    console.log(`  ✅ Checksum for test2.png: ${checksum2}`);
    
    if (checksum1 === checksum2) {
      console.log('  ✅ PASS: Checksums match for identical pixels!');
    } else {
      console.log('  ❌ FAIL: Checksums differ for identical pixels!');
      process.exit(1);
    }
    
    // Test 3: Create a different image and verify checksum differs
    console.log('\nTest 3: Creating different image and verifying checksum changes...');
    const testImage3 = path.join(testDir, 'test3.png');
    await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 0, g: 255, b: 0 }
      }
    }).png().toFile(testImage3);
    
    const checksum3 = await calculatePixelChecksum(testImage3);
    console.log(`  ✅ Checksum for test3.png: ${checksum3}`);
    
    if (checksum1 !== checksum3) {
      console.log('  ✅ PASS: Checksums differ for different pixels!');
    } else {
      console.log('  ❌ FAIL: Checksums match for different pixels!');
      process.exit(1);
    }
    
    // Test 4: Test with grayscale image (create RGB, then convert to grayscale)
    console.log('\nTest 4: Testing with grayscale image...');
    const testImage4 = path.join(testDir, 'test4.png');
    await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 128, g: 128, b: 128 }
      }
    }).greyscale().png().toFile(testImage4);
    
    const checksum4 = await calculatePixelChecksum(testImage4);
    console.log(`  ✅ Checksum for test4.png (grayscale): ${checksum4}`);
    
    // Test 5: Test with different dimensions
    console.log('\nTest 5: Testing that different dimensions produce different checksums...');
    const testImage5 = path.join(testDir, 'test5.png');
    await sharp({
      create: {
        width: 200,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    }).png().toFile(testImage5);
    
    const checksum5 = await calculatePixelChecksum(testImage5);
    console.log(`  ✅ Checksum for test5.png (different size): ${checksum5}`);
    
    if (checksum1 !== checksum5) {
      console.log('  ✅ PASS: Checksums differ for different dimensions!');
    } else {
      console.log('  ❌ FAIL: Checksums match despite different dimensions!');
      process.exit(1);
    }
    
    // Test 6: Verify checksum format (8 characters, lowercase hex)
    console.log('\nTest 6: Verifying checksum format...');
    const checksumPattern = /^[0-9a-f]{8}$/;
    if (checksumPattern.test(checksum1)) {
      console.log('  ✅ PASS: Checksum format is correct (8-char lowercase hex)');
    } else {
      console.log('  ❌ FAIL: Checksum format is incorrect');
      process.exit(1);
    }
    
    console.log('\n✅ All tests passed!');
    
    // Cleanup
    await fs.remove(testDir);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
