/**
 * Configuration module
 * Loads and validates environment variables from .env file
 */

require('dotenv').config();
const path = require('path');

/**
 * Parses a comma-separated string of file extensions
 * @param {string} extensionsString - Comma-separated extensions (e.g., ".mov,.mp4,.mp3")
 * @returns {string[]} Array of normalized extensions
 */
function parseExtensions(extensionsString) {
  if (!extensionsString) {
    return [];
  }

  return extensionsString
    .split(',')
    .map(ext => ext.trim())
    .filter(ext => ext.length > 0)
    .map(ext => ext.startsWith('.') ? ext : `.${ext}`);
}

/**
 * Validates that required configuration values are present
 * @throws {Error} If required values are missing
 */
function validateConfig() {
  if (!process.env.WATCH_FOLDER) {
    throw new Error(
      'WATCH_FOLDER is required in .env file. ' +
      'Please copy .env.example to .env and set WATCH_FOLDER.'
    );
  }
}

// Validate required configuration
validateConfig();

// Default values
const DEFAULT_SUPPORTED_EXTENSIONS = ['.mov', '.mp4', '.mp3', '.wav', '.m4a'];
const DEFAULT_HEADLESS_MODE = true;

/**
 * Application configuration
 * All configuration values are loaded from environment variables
 */
const config = {
  // Folder configuration
  WATCH_FOLDER: process.env.WATCH_FOLDER,
  PROCESSED_FOLDER: process.env.PROCESSED_FOLDER ||
                    path.join(process.env.WATCH_FOLDER, 'Processed'),

  // File type configuration
  SUPPORTED_EXTENSIONS: (() => {
    const parsed = parseExtensions(process.env.SUPPORTED_EXTENSIONS);
    return parsed.length > 0 ? parsed : DEFAULT_SUPPORTED_EXTENSIONS;
  })(),

  // Browser configuration
  HEADLESS_MODE: process.env.HEADLESS_MODE === 'true' ||
                 (process.env.HEADLESS_MODE === undefined && DEFAULT_HEADLESS_MODE),

  // Email configuration (for future notifications)
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'gmail',
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  EMAIL_TO: process.env.EMAIL_TO,

  // Grain credentials
  GRAIN_EMAIL: process.env.GRAIN_EMAIL,
  GRAIN_PASSWORD: process.env.GRAIN_PASSWORD
};

module.exports = config;
