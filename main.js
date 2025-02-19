import puppeteer from 'puppeteer';
import fs from 'fs';
import os from 'os';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { writeHeapSnapshot } from 'v8';

/**
 * @param {quiet: boolean} options 
 * @returns {Logger} Logger Instance
 */
function Logger( {quiet} ) {
    const devnull = () => {};
    const oraInstance = (!quiet) ? ora() : null;

    this.log = ( what, ...args ) => {
        if ( quiet ) return;
        if ( ! [ 'start', 'info', 'debug'].includes(what) ) return;

        return oraInstance[what](...args);
    }

    this.start = (...args) => this.log('start', args);
    this.info = (...args) => this.log('info', args);
    this.fail = (...args) => this.log('fail', args);
    
    return this;
}

/**
 * Launches a Puppeteer browser instance.
 * @param {string} userDataDir - The directory for user data.
 * @param {boolean} headless - Whether to launch the browser in headless mode.
 * @param {boolean} quiet - Whether to suppress spinner output.
 * @returns {Promise<puppeteer.Browser>}
 */
async function launchBrowser(userDataDir, headless = true, quiet = false) {
    Logger.start('Launching browser...')
    const browser = await puppeteer.launch({ userDataDir, headless });
    Logger.succeed('Browser Launched!')
    return browser;
}

/**
 * Navigates to a specified URL using a Puppeteer page instance.
 * @param {puppeteer.Page} page - The Puppeteer page instance.
 * @param {string} url - The URL to navigate to.
 * @param {boolean} quiet - Whether to suppress spinner output.
 * @returns {Promise<void>}
 */
async function navigateToPage(page, url, quiet = false) {
    Logger.start(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle0' });
    Logger.succeed(`Navigated to ${url}.`);
}

/**
 * Evaluates a script on a Puppeteer page instance.
 * @param {puppeteer.Page} page - The Puppeteer page instance.
 * @param {string} scriptContent - The script content to evaluate.
 * @param {boolean} quiet - Whether to suppress spinner output.
 * @returns {Promise<any>}
 */
async function evaluateScript(page, scriptContent, quiet = false) {
    Logger.start('Evaluating script on the page...')
    
    const result = await page.evaluate(new Function(scriptContent))
        .catch( e => Logger.error( e.message ) );
    
    Logger.succeed('Script evaluated.');

    return result;
}

/**
 * Takes a screenshot of the entire page.
 * @param {puppeteer.Page} page - The Puppeteer page instance.
 * @param {string} screenshotPath - The path to save the screenshot.
 * @param {boolean} quiet - Whether to suppress spinner output.
 * @returns {Promise<void>}
 */
async function takeScreenshot(page, screenshotPath, quiet = false) {
    const [
        screenPath,  // (out) Screenshot path
        comparePath, // (in) Compare Screenshot above with this file (if it is passed)
        diffPath     // (out) Generate a diff- image from the new screenshot and the comparison one.
    ] = screenshotPath.split(',');

    if (!quiet) spinner.start(chalk.blue('Taking screenshot...'));
    await page.screenshot({ path: screenPath, fullPage: true });
    if (!quiet) spinner.succeed(chalk.green(`Screenshot saved to ${screenPath}.`));

    if (comparePath) {

        const resembleResult = new Promise( async resolve => {
            await import('resemblejs').compare(
                screenPath,
                comparePath
            ).onComplete( result => resolve )
        })
    }
}

/**
 * Reads the script content from scripts passed through options.
 * @param {Object} options - The options object containing scriptFiles.
 * @returns {string[]} - Script content.
 */
function readScriptContent(options) {
    if ( ! options.scripts ) return [];

    return options.scripts.split(',').map((scriptFile) => {
        if (!fs.existsSync(scriptFile)) {
            console.error(`Script not found: ${scriptFile}`);
            return '';
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

    if (!options.scripts && !options.interactive && !options.screenshot) {
        console.error('One (or more) of --scriptFiles, --interactive, or --screenshot option must be provided.');
        process.exit(1);
    }

    const { url, interactive, quiet } = options;
    const scriptContent = readScriptContent(options);

    try {
        const userDataDir = path.join(os.tmpdir(), 'puppet-this_user_data');
        const browser = await launchBrowser(userDataDir, !interactive, quiet);
        const page = await browser.newPage();

        await navigateToPage(page, url, quiet);

        const result = await (async () => {
            return (await Promise.all(scriptContent.map( script => evaluateScript(page, script, quiet) ))).join('\n');
        })();

        if (options.screenshot) {
            await takeScreenshot(page, options.screenshot, quiet);
        }

        if (interactive) {
            if (!quiet) spinner.info(chalk.blue('Interactive mode enabled. Please handle any interactions manually. (any script output will be printed afterwards)'));
            if (!quiet) spinner.start(chalk.blue('Waiting for user to finish their business and close the browser window...'));
            await new Promise(resolve => browser.on('disconnected', resolve));
            if (!quiet) spinner.succeed(chalk.green('Browser window closed. Exiting...'));
            return;
        }
        
        await browser.close();

        if (options.cleanup) {
            if (!quiet) spinner.start(chalk.blue('Cleaning up user data directory...'));
            await rimraf(userDataDir);
            if (!quiet) spinner.succeed(chalk.green('User data directory cleaned up.'));
        }

        console.log(result);
    } catch (err) {
        if (!quiet) spinner.fail(chalk.red('An error occurred.'));
        console.error(chalk.red(err.message));
        process.exit(1);
    }
};

export default main;
