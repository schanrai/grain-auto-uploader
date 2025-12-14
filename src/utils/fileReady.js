/**
 * File readiness utilities
 * Ensures files are completely written before processing
 */

const fs = require('fs');

/**
 * Waits for a file to reach a stable size before considering it ready
 * This prevents processing files that are still being written
 *
 * @param {string} filePath - Path to the file to monitor
 * @param {Object} options - Configuration options
 * @param {number} options.intervalMs - Time between size checks in milliseconds (default: 500)
 * @param {number} options.stableChecks - Number of consecutive unchanged checks required (default: 2)
 * @param {number} options.timeoutMs - Maximum time to wait in milliseconds (default: 30000)
 * @returns {Promise<void>} Resolves when file is stable
 * @throws {Error} If file is deleted, becomes inaccessible, or timeout is reached
 */
async function waitForStableFile(filePath, options = {}) {
  const {
    intervalMs = 500,
    stableChecks = 2,
    timeoutMs = 30000
  } = options;

  const startTime = Date.now();
  let previousSize = -1;
  let stableCount = 0;

  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(async () => {
      try {
        // Check if we've exceeded the timeout
        if (Date.now() - startTime > timeoutMs) {
          clearInterval(checkInterval);
          reject(new Error(`Timeout waiting for file to stabilize after ${timeoutMs}ms`));
          return;
        }

        // Check if file still exists
        if (!fs.existsSync(filePath)) {
          clearInterval(checkInterval);
          reject(new Error('File was deleted while waiting for it to stabilize'));
          return;
        }

        // Get current file size
        let currentSize;
        try {
          const stats = fs.statSync(filePath);
          currentSize = stats.size;
        } catch (error) {
          // File might be temporarily locked or inaccessible
          if (error.code === 'EACCES' || error.code === 'EBUSY') {
            // Reset stable count and continue waiting
            stableCount = 0;
            previousSize = -1;
            return;
          }
          // Other errors should stop the process
          clearInterval(checkInterval);
          reject(new Error(`Failed to access file: ${error.message}`));
          return;
        }

        // Compare with previous size
        if (currentSize === previousSize) {
          stableCount++;

          // File is stable if size hasn't changed for required number of checks
          if (stableCount >= stableChecks) {
            clearInterval(checkInterval);
            resolve();
          }
        } else {
          // Size changed, reset the stable counter
          stableCount = 0;
          previousSize = currentSize;
        }
      } catch (error) {
        clearInterval(checkInterval);
        reject(new Error(`Unexpected error during stability check: ${error.message}`));
      }
    }, intervalMs);
  });
}

module.exports = {
  waitForStableFile
};
