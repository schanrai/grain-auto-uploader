/**
 * Email notification module
 * Sends success and error notifications via email
 */

const nodemailer = require('nodemailer');
const config = require('./config');
const logger = require('./utils/logger');

/**
 * Creates a nodemailer transporter for sending emails
 * @returns {object|null} Nodemailer transporter or null if config is missing
 */
function createTransporter() {
  // Check if email is configured
  if (!config.EMAIL_USER || !config.EMAIL_PASSWORD) {
    logger.log('Email notifications disabled: EMAIL_USER or EMAIL_PASSWORD not configured');
    return null;
  }

  try {
    return nodemailer.createTransport({
      service: config.EMAIL_SERVICE,
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASSWORD
      }
    });
  } catch (error) {
    logger.error(`Failed to create email transporter: ${error.message}`);
    return null;
  }
}

/**
 * Sends a success notification email
 * @param {Object} params - Email parameters
 * @param {string} params.filename - The name of the file that was processed
 * @param {string} params.timestamp - ISO timestamp of when processing completed
 * @param {string} params.details - Additional success details
 * @param {string} [params.recordingUrl] - Optional Grain recording URL
 * @returns {Promise<boolean>} True if email was sent successfully, false otherwise
 */
async function sendSuccessEmail({ filename, timestamp, details, recordingUrl }) {
  const transporter = createTransporter();

  if (!transporter) {
    return false;
  }

  const emailTo = config.EMAIL_TO || config.EMAIL_USER;

  const recordingUrlText = recordingUrl ? `\n\nView your recording:\n${recordingUrl}` : '';

  const mailOptions = {
    from: config.EMAIL_USER,
    to: emailTo,
    subject: `[Grain Uploader] Success: ${filename}`,
    text: `
Grain Auto-Uploader - Success Notification
==========================================

Your file has been successfully processed and uploaded!

File Details:
-------------
Filename: ${filename}
Completed: ${timestamp}
Status: Successfully processed and moved to Processed folder

${details || 'Processing completed without errors.'}${recordingUrlText}

---
This is an automated message from Grain Auto-Uploader.
If you did not expect this email, please check your uploader configuration.
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 15px; border-radius: 5px 5px 0 0; }
    .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }
    .footer { font-size: 12px; color: #666; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
    .file-details { background-color: white; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0; }
    .success-icon { font-size: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="success-icon">✓</span> Grain Auto-Uploader - Success
    </div>
    <div class="content">
      <p><strong>Your file has been successfully processed and uploaded!</strong></p>

      <div class="file-details">
        <p><strong>Filename:</strong> ${filename}</p>
        <p><strong>Completed:</strong> ${new Date(timestamp).toLocaleString()}</p>
        <p><strong>Status:</strong> Successfully processed and moved to Processed folder</p>
      </div>

      <p>${details || 'Processing completed without errors.'}</p>

      ${recordingUrl ? `
      <div style="margin: 20px 0; padding: 15px; background-color: #e8f5e9; border: 1px solid #4CAF50; border-radius: 3px;">
        <p><strong>View your recording:</strong></p>
        <p><a href="${recordingUrl}" style="color: #4CAF50; text-decoration: none; font-weight: bold;">${recordingUrl}</a></p>
      </div>
      ` : ''}
    </div>
    <div class="footer">
      <p>This is an automated message from Grain Auto-Uploader.</p>
      <p>If you did not expect this email, please check your uploader configuration.</p>
    </div>
  </div>
</body>
</html>
    `.trim()
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.log(`Success email sent for: ${filename}`);
    return true;
  } catch (error) {
    // Log warning but don't crash - email is non-critical
    logger.error(`Failed to send success email for ${filename}: ${error.message}`);
    return false;
  }
}

/**
 * Sends an error notification email
 * @param {Object} params - Email parameters
 * @param {string} params.filename - The name of the file that failed
 * @param {string} params.timestamp - ISO timestamp of when the error occurred
 * @param {string} params.error - Error message or details
 * @returns {Promise<boolean>} True if email was sent successfully, false otherwise
 */
async function sendErrorEmail({ filename, timestamp, error }) {
  const transporter = createTransporter();

  if (!transporter) {
    return false;
  }

  const emailTo = config.EMAIL_TO || config.EMAIL_USER;

  const mailOptions = {
    from: config.EMAIL_USER,
    to: emailTo,
    subject: `[Grain Uploader] Error: ${filename}`,
    text: `
Grain Auto-Uploader - Error Notification
=========================================

An error occurred while processing your file.

File Details:
-------------
Filename: ${filename}
Error Time: ${timestamp}
Status: Failed to process

Error Details:
--------------
${error}

Troubleshooting Tips:
---------------------
1. Check that the file is not corrupted or in use by another program
2. Verify your Grain account credentials are correct in the .env file
3. Ensure you have sufficient disk space
4. Check the application logs for more detailed error messages
5. Try manually uploading the file to test if it's a file-specific issue

The file has NOT been moved to the Processed folder and will remain in the watch folder.

---
This is an automated message from Grain Auto-Uploader.
If you need assistance, check the logs or documentation.
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f44336; color: white; padding: 15px; border-radius: 5px 5px 0 0; }
    .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }
    .footer { font-size: 12px; color: #666; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
    .file-details { background-color: white; padding: 15px; border-left: 4px solid #f44336; margin: 15px 0; }
    .error-box { background-color: #ffebee; padding: 15px; border: 1px solid #f44336; border-radius: 3px; margin: 15px 0; }
    .error-icon { font-size: 24px; }
    .tips { background-color: white; padding: 15px; margin: 15px 0; }
    .tips ul { margin: 10px 0; padding-left: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="error-icon">✗</span> Grain Auto-Uploader - Error
    </div>
    <div class="content">
      <p><strong>An error occurred while processing your file.</strong></p>

      <div class="file-details">
        <p><strong>Filename:</strong> ${filename}</p>
        <p><strong>Error Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
        <p><strong>Status:</strong> Failed to process</p>
      </div>

      <div class="error-box">
        <p><strong>Error Details:</strong></p>
        <p>${error}</p>
      </div>

      <div class="tips">
        <p><strong>Troubleshooting Tips:</strong></p>
        <ul>
          <li>Check that the file is not corrupted or in use by another program</li>
          <li>Verify your Grain account credentials are correct in the .env file</li>
          <li>Ensure you have sufficient disk space</li>
          <li>Check the application logs for more detailed error messages</li>
          <li>Try manually uploading the file to test if it's a file-specific issue</li>
        </ul>
      </div>

      <p><strong>Note:</strong> The file has NOT been moved to the Processed folder and will remain in the watch folder.</p>
    </div>
    <div class="footer">
      <p>This is an automated message from Grain Auto-Uploader.</p>
      <p>If you need assistance, check the logs or documentation.</p>
    </div>
  </div>
</body>
</html>
    `.trim()
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.log(`Error email sent for: ${filename}`);
    return true;
  } catch (error) {
    // Log warning but don't crash - email is non-critical
    logger.error(`Failed to send error email for ${filename}: ${error.message}`);
    return false;
  }
}

module.exports = {
  sendSuccessEmail,
  sendErrorEmail
};
