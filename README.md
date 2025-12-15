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

### Testing Grain Login

Before running the full uploader, you should test that your Grain credentials work correctly:

```bash
node test-login.js
```

**What this does:**
- Launches a browser window (visible by default)
- Navigates to Grain login page
- Enters your credentials from `.env`
- Attempts to log in
- Takes screenshots of the process
- Reports success or failure

**Command options:**
```bash
# Default: Run with visible browser (recommended for first test)
node test-login.js

# Run in headless mode (no visible browser)
node test-login.js --headless
```

**Expected output:**
```
[TIMESTAMP] Starting Grain login test...
[TIMESTAMP] Launching browser (headless: false)...
[TIMESTAMP] Navigating to Grain login page...
[TIMESTAMP] Entering email: your-email@example.com
[TIMESTAMP] Entering password...
[TIMESTAMP] Clicking login button...
[TIMESTAMP] ✓ Grain login test PASSED
```

**Screenshots saved to `logs/` directory:**
- `login-before-submit.png` - Login form before submission
- `login-success.png` - Dashboard after successful login
- `login-error.png` - Error state (if login fails)

**Exit codes:**
- `0` - Login successful
- `1` - Login failed

**Troubleshooting login test:**
- Make sure `GRAIN_EMAIL` and `GRAIN_PASSWORD` are set correctly in `.env`
- Check that your Grain account credentials are valid
- Try logging in manually to Grain first to ensure your account works
- If login fails, check `logs/login-error.png` to see what went wrong
- Some accounts may have 2FA enabled - this may require additional setup

### Testing File Upload

After verifying login works, you can test uploading a single file to Grain:

```bash
node test-upload.js "/path/to/your/audio-file.mp3"
```

**What this does:**
- Logs into Grain via Google OAuth
- Navigates to the upload page
- Selects and uploads your file
- Monitors GraphQL responses for upload success
- Returns the recording URL and ID

**Command options:**
```bash
# Default: Run with visible browser (recommended for first test)
node test-upload.js "/path/to/file.mp3"

# Run in headless mode (no visible browser)
node test-upload.js "/path/to/file.mp3" --headless
```

**Expected output:**
```
[TIMESTAMP] Starting Grain file upload...
[TIMESTAMP] File: /path/to/file.mp3
[TIMESTAMP] Launching browser (headless: false)...
[TIMESTAMP] Logging into Grain...
[TIMESTAMP] Navigating to upload page...
[TIMESTAMP] Looking for file input...
[TIMESTAMP] Uploading file...
[TIMESTAMP] Waiting for upload to complete...
[TIMESTAMP] ✓ Upload success detected via GraphQL response!
[TIMESTAMP] Recording ID: abc-123-def-456
[TIMESTAMP] Recording URL: https://grain.com/share/recording/...
[TIMESTAMP] ✓ File uploaded successfully to Grain!
```

**Success indicators:**
- GraphQL response with `operationName: "recording"`
- Response contains `data.recording.recordingUrl` (non-empty)
- Response contains `data.recording.state === "PROCESSING"`
- Returns recording URL you can visit

**Screenshots saved to `logs/` directory:**
- `upload-error.png` - Error state (if upload fails)
- `upload-timeout.png` - If upload times out after 60 seconds

**Exit codes:**
- `0` - Upload successful
- `1` - Upload failed

**Supported file types:**
- Audio: `.mp3`, `.wav`, `.m4a`
- Video: `.mov`, `.mp4` (H.264 codec)

**Troubleshooting upload test:**
- Make sure the file path is correct and the file exists
- Ensure the file is a supported type (see above)
- Large files may take longer to upload - be patient
- If upload fails, check `logs/upload-error.png` to see what went wrong
- If upload times out, check `logs/upload-timeout.png`
- Make sure you have a stable internet connection

**Note:** This is a standalone test script. For automatic uploads, use the main uploader (see Production Setup below).

## Production Setup with PM2

For production use, it's recommended to run the uploader with PM2 for automatic restarts and process management.

### Install PM2

```bash
npm install -g pm2
```

### Start with PM2

```bash
npm run pm2:start
```

This will:
- Start the uploader as a background process
- Auto-restart if it crashes
- Restart if memory usage exceeds 500MB
- Log all output to `logs/pm2-out.log` and `logs/pm2-error.log`

### PM2 Commands

```bash
# View logs
npm run pm2:logs

# Stop the uploader
npm run pm2:stop

# Restart the uploader
npm run pm2:restart

# Remove from PM2
npm run pm2:delete
```

### Auto-start on System Boot

To make the uploader start automatically when your Mac boots:

1. **Generate startup script:**
   ```bash
   pm2 startup
   ```

2. **Copy and run the command** that PM2 outputs (it will look something like):
   ```bash
   sudo env PATH=$PATH:/path/to/node pm2 startup launchd -u yourusername --hp /Users/yourusername
   ```

3. **Save the current PM2 process list:**
   ```bash
   pm2 save
   ```

Now the uploader will automatically start whenever your Mac reboots!

### PM2 Monitoring

```bash
# View process status
pm2 status

# View detailed info
pm2 info grain-uploader

# Monitor in real-time
pm2 monit
```

### Troubleshooting PM2

**Problem: PM2 command not found**
- Solution: Install PM2 globally with `npm install -g pm2`

**Problem: Process keeps restarting**
- Check logs: `npm run pm2:logs`
- Check for errors in `logs/pm2-error.log`
- Verify your `.env` file is configured correctly

**Problem: Auto-start not working after reboot**
- Run `pm2 startup` again and follow the instructions
- Make sure you ran `pm2 save` after starting the uploader
- Check: `pm2 list` should show your process

**Problem: Can't see recent logs**
- PM2 logs are in `logs/pm2-out.log` and `logs/pm2-error.log`
- Application logs with timestamps are in the PM2 output
- Use `pm2 flush` to clear old logs if needed

## Project Structure

```
grain-auto-uploader/
├── src/
│   ├── config.js           # Configuration management
│   ├── index.js            # Main entry point
│   ├── notifier.js         # Email notifications
│   ├── processor.js        # File processing logic
│   ├── uploader.js         # Grain browser automation
│   ├── watcher.js          # Folder monitoring
│   └── utils/
│       ├── fileHandler.js  # File operations
│       ├── fileReady.js    # File stability checking
│       └── logger.js       # Logging utilities
├── logs/                   # Application logs & screenshots
├── test-login.js           # Grain login test script
├── test-upload.js          # File upload test script
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
