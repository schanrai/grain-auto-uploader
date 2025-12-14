/**
 * Grain uploader module
 * Handles browser automation for logging into Grain and uploading files
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const logger = require('./utils/logger');

// Grain URLs
const GRAIN_LOGIN_URL = 'https://grain.com/login';
const GRAIN_DASHBOARD_URL = 'https://grain.com/share';

/**
 * Tests login to Grain account using Puppeteer
 * Launches a browser, navigates to Grain login, fills credentials, and verifies success
 *
 * @param {Object} options - Test options
 * @param {boolean} options.headless - Whether to run browser in headless mode (default: false for testing)
 * @returns {Promise<boolean>} True if login successful, false otherwise
 */
async function testGrainLogin(options = {}) {
  const headless = options.headless !== undefined ? options.headless : false;

  let browser = null;

  try {
    logger.log('Starting Grain login test...');

    // Validate credentials are configured
    if (!config.GRAIN_EMAIL || !config.GRAIN_PASSWORD) {
      logger.error('GRAIN_EMAIL or GRAIN_PASSWORD not configured in .env file');
      return false;
    }

    logger.log(`Launching browser (headless: ${headless})...`);

    // Launch browser with optimized settings for Apple Silicon
    browser = await puppeteer.launch({
      headless: headless ? 'new' : false, // Use new headless mode for better performance
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      defaultViewport: {
        width: 1280,
        height: 800
      },
      timeout: 60000 // Increase browser launch timeout to 60s
    });

    const page = await browser.newPage();

    // Set a realistic user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Set longer timeout for slow networks/Apple Silicon
    page.setDefaultTimeout(60000);

    logger.log(`Navigating to Grain login page: ${GRAIN_LOGIN_URL}`);
    await page.goto(GRAIN_LOGIN_URL, {
      waitUntil: 'domcontentloaded', // Less strict than networkidle2
      timeout: 60000
    });

    // Give the page extra time to fully load OAuth buttons
    logger.log('Waiting for page to fully load...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Look for "Sign in with Google" button by clicking it via JavaScript
    logger.log('Looking for "Sign in with Google" button...');

    const buttonClicked = await page.evaluate(() => {
      // Find button by text content
      const buttons = Array.from(document.querySelectorAll('button, a, div[role="button"]'));
      const googleButton = buttons.find(btn => {
        const text = btn.textContent.toLowerCase();
        return text.includes('google') || text.includes('sign in with google');
      });

      if (googleButton) {
        googleButton.click();
        return true;
      }
      return false;
    });

    if (!buttonClicked) {
      throw new Error('Could not find "Sign in with Google" button');
    }

    logger.log('Clicked "Sign in with Google"');

    // Wait for redirect to Google OAuth page
    logger.log('Waiting for Google OAuth page...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Wait for Google email input
    logger.log('Waiting for Google login form...');
    await page.waitForSelector('input[type="email"]', { timeout: 20000 });

    // Enter Google email
    logger.log(`Entering Google email: ${config.GRAIN_EMAIL}`);
    await page.type('input[type="email"]', config.GRAIN_EMAIL, { delay: 50 });

    // Click Next button on Google email page
    logger.log('Clicking Next...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const nextBtn = buttons.find(btn =>
        btn.textContent.includes('Next') ||
        btn.textContent.includes('next') ||
        btn.id === 'identifierNext'
      );
      if (nextBtn) nextBtn.click();
    });

    // Wait for password page
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Wait for Google password input
    logger.log('Waiting for password field...');
    await page.waitForSelector('input[type="password"]', { timeout: 20000 });

    // Enter Google password
    logger.log('Entering Google password...');
    await page.type('input[type="password"]', config.GRAIN_PASSWORD, { delay: 50 });

    // Take a screenshot before clicking login
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    await page.screenshot({
      path: path.join(logsDir, 'login-before-submit.png'),
      fullPage: true
    });
    logger.log('Screenshot saved: logs/login-before-submit.png');

    // Click the Next/Sign in button on Google password page
    logger.log('Clicking Sign in...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const nextBtn = buttons.find(btn =>
        btn.textContent.includes('Next') ||
        btn.textContent.includes('Sign in') ||
        btn.textContent.includes('Continue') ||
        btn.id === 'passwordNext'
      );
      if (nextBtn) nextBtn.click();
    });

    // Wait for Google OAuth redirect back to Grain
    logger.log('Waiting for Google OAuth to complete and redirect to Grain...');
    try {
      await page.waitForNavigation({
        timeout: 30000,
        waitUntil: 'domcontentloaded'
      });
      logger.log('Redirected after Google login');
    } catch (navError) {
      logger.log('Navigation timeout, checking current state...');
    }

    // Wait for Grain dashboard to load after OAuth
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Get current URL
    const currentUrl = page.url();
    logger.log(`Current URL after login: ${currentUrl}`);

    // Check for success indicators
    let loginSuccess = false;

    // Check 1: URL changed to dashboard or doesn't contain 'login'
    if (!currentUrl.includes('login') &&
        (currentUrl.includes('share') ||
         currentUrl.includes('dashboard') ||
         currentUrl.includes('home') ||
         currentUrl.includes('grain.com'))) {
      logger.log('Success indicator: URL changed from login page');
      loginSuccess = true;
    }

    // Check 2: Look for dashboard elements or user menu
    try {
      const dashboardElements = await page.evaluate(() => {
        // Look for common logged-in indicators
        const indicators = [
          document.querySelector('[data-testid="user-menu"]'),
          document.querySelector('.user-menu'),
          document.querySelector('[aria-label*="user" i]'),
          document.querySelector('[class*="avatar" i]'),
          document.querySelector('[class*="profile" i]'),
          document.querySelector('nav'),
          document.querySelector('header')
        ];
        return indicators.some(el => el !== null);
      });

      if (dashboardElements) {
        logger.log('Success indicator: Dashboard elements found');
        loginSuccess = true;
      }
    } catch (checkError) {
      logger.log(`Could not check for dashboard elements: ${checkError.message}`);
    }

    // Check 3: Look for error messages (indicates login failed)
    try {
      const errorMessage = await page.evaluate(() => {
        const errorEl = document.querySelector('[role="alert"], .error, [class*="error" i]');
        return errorEl ? errorEl.textContent : null;
      });

      if (errorMessage && errorMessage.toLowerCase().includes('password')) {
        logger.error(`Login error detected: ${errorMessage}`);
        loginSuccess = false;
      }
    } catch (checkError) {
      // No error message is good
    }

    // Take a screenshot after login
    await page.screenshot({
      path: path.join(logsDir, 'login-success.png'),
      fullPage: true
    });
    logger.log('Screenshot saved: logs/login-success.png');

    if (loginSuccess) {
      logger.log('✓ Grain login test PASSED');
    } else {
      logger.error('✗ Grain login test FAILED - Could not verify successful login');
    }

    return loginSuccess;

  } catch (error) {
    logger.error(`Grain login test error: ${error.message}`);

    // Try to take an error screenshot
    try {
      if (browser) {
        const pages = await browser.pages();
        if (pages.length > 0) {
          const logsDir = path.join(__dirname, '../logs');
          if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
          }
          await pages[0].screenshot({
            path: path.join(logsDir, 'login-error.png'),
            fullPage: true
          });
          logger.log('Error screenshot saved: logs/login-error.png');
        }
      }
    } catch (screenshotError) {
      // Ignore screenshot errors
    }

    return false;

  } finally {
    // Close browser
    if (browser) {
      logger.log('Closing browser...');
      await browser.close();
    }
  }
}

module.exports = {
  testGrainLogin
};
