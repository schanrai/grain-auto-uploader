#!/usr/bin/env node

/**
 * Test script for Grain file upload functionality
 * Tests that Puppeteer can successfully upload a file to Grain
 *
 * Usage:
 *   node test-upload.js "/path/to/file.mp3"
 *   node test-upload.js "/path/to/file.mp3" --headless
 *
 * Exit codes:
 *   0 - Upload successful
 *   1 - Upload failed
 */

const { uploadFileToGrain } = require('./src/uploader');
const logger = require('./src/utils/logger');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0].startsWith('--')) {
  console.error('');
  console.error('Usage: node test-upload.js "/path/to/file.mp3" [--headless]');
  console.error('');
  console.error('Example:');
  console.error('  node test-upload.js "/Users/sushichan/Desktop/Grain Uploads/test.mp3"');
  console.error('  node test-upload.js "/Users/sushichan/Desktop/Grain Uploads/test.mp3" --headless');
  console.error('');
  process.exit(1);
}

const filePath = args[0];
const headless = args.includes('--headless');

logger.log('==========================================');
logger.log('   Grain File Upload Test');
logger.log('==========================================');
logger.log('');
logger.log(`File: ${filePath}`);

if (headless) {
  logger.log('Running in HEADLESS mode (no visible browser)');
} else {
  logger.log('Running in VISIBLE mode (browser window will open)');
  logger.log('Tip: Use --headless flag to run without visible browser');
}

logger.log('');

// Run the upload
uploadFileToGrain(filePath, { headless })
  .then(result => {
    logger.log('');
    logger.log('==========================================');

    if (result.ok) {
      logger.log('✓ UPLOAD SUCCESSFUL');
      logger.log('');
      logger.log(`Recording ID: ${result.id}`);
      logger.log(`Recording URL: ${result.recordingUrl}`);
      logger.log('');
      logger.log('You can view your recording at:');
      logger.log(result.recordingUrl);
      logger.log('==========================================');
      process.exit(0);
    } else {
      logger.error('✗ UPLOAD FAILED');
      logger.log('');
      logger.error(`Reason: ${result.message}`);
      logger.log('');
      logger.log('Check logs/ directory for error screenshots');
      logger.log('==========================================');
      process.exit(1);
    }
  })
  .catch(error => {
    logger.log('');
    logger.log('==========================================');
    logger.error(`✗ UPLOAD ERROR: ${error.message}`);
    logger.log('==========================================');
    process.exit(1);
  });
