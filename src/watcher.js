/**
 * File watcher module for monitoring the Grain Uploads folder
 * Uses chokidar to detect new audio/video files and prepare them for upload
 */

const chokidar = require('chokidar');
const path = require('path');
const logger = require('./utils/logger');

// Folder to monitor for new Grain recording files
const WATCH_FOLDER = '/Users/sushichan/Desktop/Grain Uploads';

// Supported file extensions for Grain uploads
// Video: .mov, .mp4 (must use H.264 codec)
// Audio: .mp3, .wav, .m4a
const SUPPORTED_EXTENSIONS = ['.mov', '.mp4', '.mp3', '.wav', '.m4a'];

/**
 * Checks if a file has a supported extension for Grain uploads
 * @param {string} filePath - The full path to the file
 * @returns {boolean} True if the file extension is supported
 */
function isSupportedFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}

/**
 * Checks if a file is in the "Processed" subfolder (which should be ignored)
 * @param {string} filePath - The full path to the file
 * @returns {boolean} True if the file is in the Processed folder
 */
function isInProcessedFolder(filePath) {
  return filePath.includes(path.join(WATCH_FOLDER, 'Processed'));
}

/**
 * Initializes and starts the file watcher
 * Monitors the specified folder for new files with supported extensions
 */
function startWatcher() {
  logger.log('Initializing folder watcher...');
  logger.log(`Monitoring folder: ${WATCH_FOLDER}`);
  logger.log(`Supported extensions: ${SUPPORTED_EXTENSIONS.join(', ')}`);

  /**
   * Chokidar watcher configuration:
   * - ignored: Skip dotfiles and the Processed subfolder
   * - persistent: Keep the process running
   * - ignoreInitial: Don't trigger 'add' events for existing files on startup
   * - awaitWriteFinish: Wait for file write operations to complete before firing events
   *   This prevents detecting partially-written files
   */
  const watcher = chokidar.watch(WATCH_FOLDER, {
    ignored: [
      /(^|[\/\\])\../, // Ignore dotfiles
      '**/Processed/**' // Ignore the Processed subfolder
    ],
    persistent: true,
    ignoreInitial: true, // Only detect NEW files added after watcher starts
    awaitWriteFinish: {
      stabilityThreshold: 2000, // Wait 2s for file size to stabilize
      pollInterval: 100 // Check every 100ms
    }
  });

  /**
   * Event: 'add' - Fired when a new file is added to the watched folder
   * This is the main event we use to detect new Grain recordings
   */
  watcher.on('add', (filePath) => {
    // Double-check that file is not in Processed folder and has supported extension
    if (!isInProcessedFolder(filePath) && isSupportedFile(filePath)) {
      const fileName = path.basename(filePath);
      logger.log(`New file detected: ${fileName}`);

      // TODO Phase 2: Add file to upload queue
    }
  });

  /**
   * Event: 'error' - Fired when an error occurs
   */
  watcher.on('error', (err) => {
    logger.error(`Watcher error: ${err.message}`);
  });

  /**
   * Event: 'ready' - Fired when initial scan is complete and watcher is ready
   */
  watcher.on('ready', () => {
    logger.log('Watcher is ready and monitoring for new files');
  });

  return watcher;
}

module.exports = {
  startWatcher
};
