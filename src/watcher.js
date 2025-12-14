/**
 * File watcher module for monitoring the Grain Uploads folder
 * Uses chokidar to detect new audio/video files and prepare them for upload
 */

const chokidar = require('chokidar');
const path = require('path');
const config = require('./config');
const logger = require('./utils/logger');
const { ensureProcessedDir, moveToProcessed } = require('./utils/fileHandler');
const { waitForStableFile } = require('./utils/fileReady');
const { processFile } = require('./processor');
const { sendSuccessEmail, sendErrorEmail } = require('./notifier');

// Load configuration from config module
const WATCH_FOLDER = config.WATCH_FOLDER;
const SUPPORTED_EXTENSIONS = config.SUPPORTED_EXTENSIONS;
const PROCESSED_FOLDER = config.PROCESSED_FOLDER;

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
  return filePath.includes(PROCESSED_FOLDER);
}

/**
 * Initializes and starts the file watcher
 * Monitors the specified folder for new files with supported extensions
 */
function startWatcher() {
  logger.log('Initializing folder watcher...');
  logger.log(`Monitoring folder: ${WATCH_FOLDER}`);
  logger.log(`Supported extensions: ${SUPPORTED_EXTENSIONS.join(', ')}`);

  // Ensure the Processed directory exists
  // Use PROCESSED_FOLDER from config, but ensure it exists
  const processedDir = PROCESSED_FOLDER;
  try {
    const fs = require('fs');
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }
    logger.log(`Processed directory ready: ${processedDir}`);
  } catch (error) {
    logger.error(`Failed to create Processed directory: ${error.message}`);
    throw error;
  }

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
   * Processing flow:
   * 1. Wait for file to be stable (fully written)
   * 2. Process the file (upload, transcription, etc.)
   * 3. Move to Processed folder if successful
   */
  watcher.on('add', async (filePath) => {
    // Double-check that file is not in Processed folder and has supported extension
    if (!isInProcessedFolder(filePath) && isSupportedFile(filePath)) {
      const fileName = path.basename(filePath);
      logger.log(`New file detected: ${fileName}`);

      try {
        // Step 1: Wait for file to be completely written
        logger.log(`Waiting for file to stabilize: ${fileName}`);
        await waitForStableFile(filePath);
        logger.log(`File stable and ready: ${fileName}`);

        // Step 2: Process the file (upload, etc.)
        logger.log(`Processing file: ${fileName}`);
        const result = await processFile(filePath);

        // Step 3: Move to Processed if successful
        if (result.ok) {
          try {
            const destPath = moveToProcessed(filePath, processedDir);
            const destFileName = path.basename(destPath);
            logger.log(`File processed and moved to Processed: ${destFileName}`);

            // Send success email notification
            const timestamp = new Date().toISOString();
            await sendSuccessEmail({
              filename: fileName,
              timestamp: timestamp,
              details: result.message || 'File successfully processed and uploaded.'
            });
          } catch (moveError) {
            // Move failed - send error email
            logger.error(`Failed to move file to Processed: ${moveError.message}`);
            const timestamp = new Date().toISOString();
            await sendErrorEmail({
              filename: fileName,
              timestamp: timestamp,
              error: `Failed to move file to Processed folder: ${moveError.message}`
            });
          }
        } else {
          // Processing failed - send error email
          logger.error(`Processing failed, file not moved: ${fileName} - ${result.message}`);
          const timestamp = new Date().toISOString();
          await sendErrorEmail({
            filename: fileName,
            timestamp: timestamp,
            error: `Processing failed: ${result.message}`
          });
        }
      } catch (error) {
        // General error (stability check, etc.) - send error email
        logger.error(`Error handling file ${fileName}: ${error.message}`);
        const timestamp = new Date().toISOString();
        await sendErrorEmail({
          filename: fileName,
          timestamp: timestamp,
          error: `Error during file handling: ${error.message}`
        });
      }
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
