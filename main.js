import puppeteer from 'puppeteer';
import fs from 'fs';
import os from 'os';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
const spinner = ora();

/**
 * Launches a Puppeteer browser instance.
 * @param {string} userDataDir - The directory for user data.
 * @param {boolean} headless - Whether to launch the browser in headless mode.
 * @returns {Promise<puppeteer.Browser>}
 */
async function launchBrowser(userDataDir, headless = true) {
    spinner.start(chalk.blue('Launching browser...'));
    const browser = await puppeteer.launch({ userDataDir, headless });
    spinner.succeed(chalk.green('Browser launched.'));
    return browser;
}

/**
 * Navigates to a specified URL using a Puppeteer page instance.
 * @param {puppeteer.Page} page - The Puppeteer page instance.
 * @param {string} url - The URL to navigate to.
 * @returns {Promise<void>}
 */
async function navigateToPage(page, url) {
    spinner.start(chalk.blue(`Navigating to ${url}...`));
    await page.goto(url, { waitUntil: 'networkidle0' });
    spinner.succeed(chalk.green(`Navigated to ${url}.`));
}

/**
 * Evaluates a script on a Puppeteer page instance.
 * @param {puppeteer.Page} page - The Puppeteer page instance.
 * @param {string} scriptContent - The script content to evaluate.
 * @returns {Promise<any>}
 */
async function evaluateScript(page, scriptContent) {
    spinner.start(chalk.blue('Evaluating script on the page...'));
    const result = await page.evaluate(new Function(scriptContent));
    spinner.succeed(chalk.green('Script evaluated.'));
    return result;
}

/**
 * Takes a screenshot of the entire page.
 * @param {puppeteer.Page} page - The Puppeteer page instance.
 * @param {string} screenshotPath - The path to save the screenshot.
 * @returns {Promise<void>}
 */
async function takeScreenshot(page, screenshotPath) {
    spinner.start(chalk.blue('Taking screenshot...'));
    await page.screenshot({ path: screenshotPath, fullPage: true });
    spinner.succeed(chalk.green(`Screenshot saved to ${screenshotPath}.`));
}

/**
 * Reads the script content from scripts passed through options.
 * @param {Object} options - The options object containing scriptFiles.
 * @returns {string[]} - Script content.
 */
function readScriptContent(options) {
    if ( ! options.scriptFiles ) return [];

    return options.scriptFiles.split(',').map((scriptFile) => {
        if (!fs.existsSync(scriptFile)) {
            console.error(`Script file not found: ${scriptFile}`);
            process.exit(1);
        }
        return fs.readFileSync(scriptFile, 'utf8');
    });
}

/**
 * The main function to run the script.
 * @returns {Promise<void>}
 */
async function main(options) {
    const rimraf = await import('rimraf');

    if (!options.scriptFiles && !options.interactive && !options.screenshot) {
        console.error('One (or more) of --scriptFiles, --interactive, or --screenshot option must be provided.');
        process.exit(1);
    }

    const { url, interactive } = options;
    const scriptContent = readScriptContent(options);

    try {
        const userDataDir = path.join(os.tmpdir(), 'puppet-this_user_data');
        const browser = await launchBrowser(userDataDir, !interactive);
        const page = await browser.newPage();

        await navigateToPage(page, url);

        const result = await (async () => {
            return await Promise.all(scriptContent.map( script => evaluateScript(page, script) ));
        })();

        if (options.screenshot) {
            await takeScreenshot(page, options.screenshot);
        }

        if (interactive) {
            spinner.info(chalk.blue('Interactive mode enabled. Please handle any interactions manually. (any script output will be printed afterwards)'));
            spinner.start(chalk.blue('Waiting for user to finish their business and close the browser window...'));
            await new Promise(resolve => browser.on('disconnected', resolve));
            spinner.succeed(chalk.green('Browser window closed. Exiting...'));
            return;
        }
        
        await browser.close();

        if (options.cleanup) {
            spinner.start(chalk.blue('Cleaning up user data directory...'));
            await rimraf(userDataDir);
            spinner.succeed(chalk.green('User data directory cleaned up.'));
        }

        console.log(result);
    } catch (err) {
        spinner.fail(chalk.red('An error occurred.'));
        console.error(chalk.red(err.message));
        process.exit(1);
    }
};

export default main;
