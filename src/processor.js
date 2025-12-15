/**
 * File processor module
 * Handles the upload/processing logic for files
 * Phase 7: Real Grain upload integration
 */

const logger = require('./utils/logger');
const config = require('./config');
const { uploadFileToGrain } = require('./uploader');

/**
 * Processes a file by uploading it to Grain
 * Uses Puppeteer automation to log in and upload
 *
 * @param {string} filePath - The full path to the file to process
 * @returns {Promise<{ok: boolean, message: string, recordingUrl?: string, recordingId?: string}>} Processing result
 */
async function processFile(filePath) {
  try {
    logger.log(`[UPLOAD] Starting upload to Grain...`);

    // Upload file to Grain using Puppeteer
    // Use headless mode from config (default true for production)
    const result = await uploadFileToGrain(filePath, {
      headless: config.HEADLESS_MODE
    });

    if (result.ok) {
      logger.log(`[UPLOAD] ✓ Upload successful!`);
      logger.log(`[UPLOAD] Recording ID: ${result.id}`);
      logger.log(`[UPLOAD] Recording URL: ${result.recordingUrl}`);

      return {
        ok: true,
        message: `Successfully uploaded to Grain. Recording ID: ${result.id}`,
        recordingUrl: result.recordingUrl,
        recordingId: result.id
      };
    } else {
      logger.error(`[UPLOAD] ✗ Upload failed: ${result.message}`);

      return {
        ok: false,
        message: result.message
      };
    }
  } catch (error) {
    logger.error(`[UPLOAD] ✗ Processing error: ${error.message}`);

    return {
      ok: false,
      message: `Processing error: ${error.message}`
    };
  }
}

module.exports = {
  processFile
};
