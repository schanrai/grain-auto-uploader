# Grain Auto-Uploader

Automated audio/video file uploader for Grain meeting recorder. Monitors a folder for new recordings and automatically uploads them to your Grain account.

## Features

- Automatic folder monitoring for new recordings
- Support for multiple file formats (.mov, .mp4, .mp3, .wav, .m4a)
- File stability checking (waits for files to finish writing)
- Automatic file organization (moves processed files to a separate folder)
- Email notifications for successful uploads and errors
- Configurable via environment variables

## Prerequisites

- Node.js (v14 or higher)
- A Grain account
- Gmail account (for email notifications - optional)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/schanrai/grain-auto-uploader.git
   cd grain-auto-uploader
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Edit the `.env` file with your configuration (see Configuration section below)

## Configuration

Edit the `.env` file with your settings:

### Required Configuration

**WATCH_FOLDER** - Path to the folder where Grain saves recordings
```
WATCH_FOLDER=/Users/yourusername/Desktop/Grain Uploads
```

### Optional Configuration

**PROCESSED_FOLDER** - Where to move files after processing (default: `WATCH_FOLDER/Processed`)
```
# PROCESSED_FOLDER=/Users/yourusername/Desktop/Grain Uploads/Processed
```

**SUPPORTED_EXTENSIONS** - Comma-separated list of file extensions to monitor (default: `.mov,.mp4,.mp3,.wav,.m4a`)
```
# SUPPORTED_EXTENSIONS=.mov,.mp4,.mp3,.wav,.m4a
```

**HEADLESS_MODE** - Run browser in headless mode (default: `true`)
```
HEADLESS_MODE=true
```

### Grain Credentials

**GRAIN_EMAIL** - Your Grain account email
```
GRAIN_EMAIL=your-grain-email@example.com
```

**GRAIN_PASSWORD** - Your Grain account password
```
GRAIN_PASSWORD=your-grain-password
```

### Email Notifications

**EMAIL_SERVICE** - Email service provider (default: `gmail`)
```
EMAIL_SERVICE=gmail
```

**EMAIL_USER** - Your Gmail address
```
EMAIL_USER=your-email@gmail.com
```

**EMAIL_PASSWORD** - Your Gmail App Password (see instructions below)
```
EMAIL_PASSWORD=your-app-password
```

**EMAIL_TO** - Email address to send notifications to
```
EMAIL_TO=your-email@gmail.com
```

## Getting a Gmail App Password

For email notifications, you'll need to create an App Password:

1. Go to your Google Account: https://myaccount.google.com/
2. Select **Security** from the left menu
3. Under "Signing in to Google," select **2-Step Verification** (you must have this enabled)
4. At the bottom, select **App passwords**
5. Select app: **Mail**
6. Select device: **Other (Custom name)**
7. Enter "Grain Auto-Uploader" as the name
8. Click **Generate**
9. Copy the 16-character password (remove spaces)
10. Paste it in your `.env` file as `EMAIL_PASSWORD`

**Note:** Keep your App Password secure and never commit your `.env` file to version control!

## Email Notifications

The uploader sends email notifications for both successful uploads and errors. This helps you stay informed about the status of your file uploads without monitoring the application constantly.

### Setting Up Email Notifications

1. **Configure your email credentials** in the `.env` file (see "Getting a Gmail App Password" section above)
2. Make sure `EMAIL_USER`, `EMAIL_PASSWORD`, and `EMAIL_TO` are set
3. Email notifications will be sent automatically when files are processed

**Note:** If email credentials are not configured, the uploader will still work normally but won't send notifications. Email sending errors won't crash the application - they'll just be logged.

### What Emails Look Like

**Success Email:**
- **Subject:** `[Grain Uploader] Success: filename.mp3`
- **Content:**
  - Filename that was processed
  - Timestamp when processing completed
  - Confirmation that file was moved to Processed folder
  - Formatted in both plain text and HTML

**Error Email:**
- **Subject:** `[Grain Uploader] Error: filename.mp3`
- **Content:**
  - Filename that failed
  - Timestamp when error occurred
  - Detailed error message
  - Troubleshooting tips
  - Note that file remains in the watch folder
  - Formatted in both plain text and HTML

### Testing Email Notifications

To test that email notifications are working:

1. **Ensure your `.env` is configured** with valid email credentials
2. **Start the uploader:** `npm start`
3. **Drop a test file** into your watch folder:
   ```bash
   touch "/path/to/watch/folder/test.mp3"
   ```
4. **Check your email** (the address in `EMAIL_TO`) within a few seconds
5. You should receive a success email since processing is currently stubbed to always succeed

**Tip:** Check your spam folder if you don't see the email in your inbox. You may need to mark it as "Not Spam" the first time.

## Usage

### Start the uploader

```bash
npm start
```

The uploader will:
1. Monitor the configured folder for new recordings
2. Wait for files to finish writing
3. Process/upload the file
4. Move processed files to the "Processed" subfolder

### Development mode (with auto-reload)

```bash
npm run dev
```

Note: This requires nodemon to be installed (`npm install -g nodemon`)

## Project Structure

```
grain-auto-uploader/
├── src/
│   ├── config.js           # Configuration management
│   ├── index.js            # Main entry point
│   ├── notifier.js         # Email notifications
│   ├── processor.js        # File processing logic
│   ├── watcher.js          # Folder monitoring
│   └── utils/
│       ├── fileHandler.js  # File operations
│       ├── fileReady.js    # File stability checking
│       └── logger.js       # Logging utilities
├── logs/                   # Application logs
├── .env                    # Your configuration (not in git)
├── .env.example            # Configuration template
└── package.json
```

## Troubleshooting

### "WATCH_FOLDER is required" error
Make sure you've created a `.env` file (copy from `.env.example`) and set the `WATCH_FOLDER` variable.

### Files not being detected
- Verify the `WATCH_FOLDER` path is correct
- Check that files have a supported extension
- Ensure the watcher has read permissions for the folder

### Files not moving to Processed folder
- Check write permissions for the watch folder
- Verify there's enough disk space
- Check the logs for specific error messages

### Email notifications not working
- Verify `EMAIL_USER`, `EMAIL_PASSWORD`, and `EMAIL_TO` are set in `.env`
- Make sure you're using a Gmail App Password, not your regular Gmail password
- Check that 2-Step Verification is enabled on your Google Account
- Look for email-related errors in the console logs
- Check your spam/junk folder for the notification emails
- Test your credentials by trying to send a test email manually
- Ensure your internet connection is working

### Emails going to spam
- Mark the first email as "Not Spam" in your email client
- Add your `EMAIL_USER` address to your contacts
- Check your email provider's spam filter settings

## License

MIT
