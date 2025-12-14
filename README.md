# Grain Auto-Uploader

Automated audio/video file uploader for Grain meeting recorder. Monitors a folder for new recordings and automatically uploads them to your Grain account.

## Features

- Automatic folder monitoring for new recordings
- Support for multiple file formats (.mov, .mp4, .mp3, .wav, .m4a)
- File stability checking (waits for files to finish writing)
- Automatic file organization (moves processed files to a separate folder)
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

### Email Notifications (Future Feature)

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

## License

MIT
