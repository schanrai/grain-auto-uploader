/**
 * Grain Auto-Uploader - Main Entry Point
 * Monitors a folder for new Grain recording files and automatically uploads them
 */

const logger = require('./utils/logger');
const { startWatcher } = require('./watcher');

logger.log('Grain Auto-Uploader initialized');

// Start the folder watcher
startWatcher();
