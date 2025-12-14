/**
 * File handler utilities for managing processed files
 * Handles directory creation, file moves, and error scenarios
 */

const fs = require('fs');
const path = require('path');

/**
 * Ensures the Processed directory exists within the watch directory
 * Creates it if it doesn't exist
 * @param {string} watchDir - The root watch directory path
 * @returns {string} The path to the Processed directory
 * @throws {Error} If directory creation fails
 */
function ensureProcessedDir(watchDir) {
  const processedDir = path.join(watchDir, 'Processed');

  try {
    // Check if directory exists, create if not
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }
    return processedDir;
  } catch (error) {
    throw new Error(`Failed to ensure Processed directory: ${error.message}`);
  }
}

/**
 * Generates a timestamp suffix for duplicate filenames
 * Format: YYYYMMDD-HHMMSS
 * @returns {string} Timestamp string
 */
function getTimestampSuffix() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

/**
 * Generates a unique destination path if the target file already exists
 * Appends timestamp suffix before the file extension
 * @param {string} destPath - The desired destination path
 * @returns {string} A unique destination path
 */
function getUniqueDestPath(destPath) {
  if (!fs.existsSync(destPath)) {
    return destPath;
  }

  const dir = path.dirname(destPath);
  const ext = path.extname(destPath);
  const nameWithoutExt = path.basename(destPath, ext);
  const timestamp = getTimestampSuffix();

  return path.join(dir, `${nameWithoutExt}-${timestamp}${ext}`);
}

/**
 * Copies a file and verifies the copy succeeded by comparing file sizes
 * @param {string} sourcePath - Source file path
 * @param {string} destPath - Destination file path
 * @throws {Error} If copy fails or sizes don't match
 */
function copyAndVerify(sourcePath, destPath) {
  try {
    fs.copyFileSync(sourcePath, destPath);

    // Verify the copy by comparing file sizes
    const sourceStats = fs.statSync(sourcePath);
    const destStats = fs.statSync(destPath);

    if (sourceStats.size !== destStats.size) {
      // Clean up failed copy
      fs.unlinkSync(destPath);
      throw new Error('File size mismatch after copy - copy verification failed');
    }
  } catch (error) {
    throw new Error(`Copy failed: ${error.message}`);
  }
}

/**
 * Moves a file to the Processed directory
 * Handles name collisions, cross-device moves, and common error scenarios
 * @param {string} filePath - The source file path to move
 * @param {string} processedDir - The destination Processed directory path
 * @returns {string} The final destination path where the file was moved
 * @throws {Error} If the move operation fails
 */
function moveToProcessed(filePath, processedDir) {
  try {
    // Verify source file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('Source file does not exist');
    }

    // Check if we have read permissions
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch (error) {
      throw new Error('No read permission for source file');
    }

    const fileName = path.basename(filePath);
    let destPath = path.join(processedDir, fileName);

    // Handle name collision - append timestamp if file exists
    destPath = getUniqueDestPath(destPath);

    // Attempt to rename (fast, atomic operation)
    try {
      fs.renameSync(filePath, destPath);
      return destPath;
    } catch (renameError) {
      // Handle EXDEV error (cross-device move) - fall back to copy+delete
      if (renameError.code === 'EXDEV') {
        // Copy the file and verify
        copyAndVerify(filePath, destPath);

        // Delete the original only after successful copy
        try {
          fs.unlinkSync(filePath);
        } catch (deleteError) {
          // If delete fails, we have a duplicate but at least the file is processed
          throw new Error(`File copied but original could not be deleted: ${deleteError.message}`);
        }

        return destPath;
      }

      // Handle other common errors
      if (renameError.code === 'EBUSY' || renameError.code === 'EPERM') {
        throw new Error('File is locked or in use by another process');
      }

      if (renameError.code === 'EACCES') {
        throw new Error('Permission denied - cannot write to Processed directory');
      }

      // Re-throw unexpected errors
      throw new Error(`Move failed: ${renameError.message}`);
    }
  } catch (error) {
    // Re-throw with context if not already formatted
    if (error.message.startsWith('Source file') ||
        error.message.startsWith('No read permission') ||
        error.message.startsWith('File is locked') ||
        error.message.startsWith('Permission denied') ||
        error.message.startsWith('Move failed') ||
        error.message.startsWith('File copied')) {
      throw error;
    }
    throw new Error(`Failed to move file to Processed: ${error.message}`);
  }
}

module.exports = {
  ensureProcessedDir,
  moveToProcessed
};
