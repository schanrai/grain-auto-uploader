/**
 * Simple logger utility with timestamps
 * Formats log messages with ISO timestamp prefix
 */

/**
 * Logs a message with a timestamp prefix
 * @param {string} message - The message to log
 */
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

/**
 * Logs an error message with a timestamp prefix
 * @param {string} message - The error message to log
 */
function error(message) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${message}`);
}

module.exports = {
  log,
  error
};
