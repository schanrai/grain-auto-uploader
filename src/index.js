/**
 * Grain Auto-Uploader - Main Entry Point
 * Monitors a folder for new Grain recording files and automatically uploads them
 * Phase 7: Enhanced startup logs and graceful shutdown
 */

const logger = require('./utils/logger');
const config = require('./config');
const { startWatcher } = require('./watcher');

// Display startup banner
logger.log('==========================================');
logger.log('   Grain Auto-Uploader');
logger.log('==========================================');
logger.log('');

// Display configuration
logger.log('Configuration:');
logger.log(`  Watch Folder: ${config.WATCH_FOLDER}`);
logger.log(`  Processed Folder: ${config.PROCESSED_FOLDER}`);
logger.log(`  Supported Extensions: ${config.SUPPORTED_EXTENSIONS.join(', ')}`);
logger.log(`  Headless Mode: ${config.HEADLESS_MODE ? 'Enabled' : 'Disabled'}`);
logger.log(`  Email Notifications: ${config.EMAIL_USER ? 'Enabled' : 'Disabled'}`);
logger.log('');

// Start the folder watcher
const watcher = startWatcher();

// Graceful shutdown on Ctrl+C
process.on('SIGINT', () => {
  logger.log('');
  logger.log('==========================================');
  logger.log('Shutting down gracefully...');
  logger.log('==========================================');

  if (watcher) {
    watcher.close();
    logger.log('Watcher closed');
  }

  logger.log('Goodbye!');
  process.exit(0);
});

// Handle other termination signals
process.on('SIGTERM', () => {
  logger.log('');
  logger.log('Received SIGTERM signal, shutting down...');

  if (watcher) {
    watcher.close();
  }

  process.exit(0);
});
