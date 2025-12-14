/**
 * File processor module
 * Handles the upload/processing logic for files
 * Phase 2: Stubbed implementation - always succeeds
 */

const logger = require('./utils/logger');

/**
 * Processes a file (upload, transcription, etc.)
 * STUB: In Phase 2, this always returns success
 * Future phases will implement actual Grain API upload logic
 *
 * @param {string} filePath - The full path to the file to process
 * @returns {Promise<{ok: boolean, message: string}>} Processing result
 */
async function processFile(filePath) {
  // STUB: Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 100));

  // STUB: Always return success in Phase 2
  return {
    ok: true,
    message: 'Stubbed processing success'
  };
}

module.exports = {
  processFile
};
