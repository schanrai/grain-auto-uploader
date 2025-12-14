#!/usr/bin/env node

/**
 * Test script for Grain login functionality
 * Tests that Puppeteer can successfully log into Grain
 *
 * Usage:
 *   node test-login.js
 *   node test-login.js --headless
 *
 * Exit codes:
 *   0 - Login successful
 *   1 - Login failed
 */

const { testGrainLogin } = require('./src/uploader');
const logger = require('./src/utils/logger');

// Parse command line arguments
const args = process.argv.slice(2);
const headless = args.includes('--headless');

logger.log('==========================================');
logger.log('   Grain Login Test');
logger.log('==========================================');
logger.log('');

if (headless) {
  logger.log('Running in HEADLESS mode (no visible browser)');
} else {
  logger.log('Running in VISIBLE mode (browser window will open)');
  logger.log('Tip: Use --headless flag to run without visible browser');
}

logger.log('');

// Run the test
testGrainLogin({ headless })
  .then(success => {
    logger.log('');
    logger.log('==========================================');

    if (success) {
      logger.log('✓ TEST PASSED: Successfully logged into Grain');
      logger.log('Check logs/login-success.png for screenshot');
      logger.log('==========================================');
      process.exit(0);
    } else {
      logger.error('✗ TEST FAILED: Could not log into Grain');
      logger.log('Check logs/ directory for error screenshots');
      logger.log('==========================================');
      process.exit(1);
    }
  })
  .catch(error => {
    logger.log('');
    logger.log('==========================================');
    logger.error(`✗ TEST ERROR: ${error.message}`);
    logger.log('==========================================');
    process.exit(1);
  });
