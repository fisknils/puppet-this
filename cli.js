#!/usr/bin/env node

import puppeteer from 'puppeteer';
import fs from 'fs';
import { Command } from 'commander';
import os from 'os';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { version } = require('./package.json');

const spinner = ora();

/**
 * Parses cli arguments Commander.
 * @returns {object}
 */
function parseOptions() {
    const program = new Command();
    program
        .name('puppet-this')
        .description('Evaluate a .js script on a webpage using Puppeteer')
        .version(version)
        .option('-f, --scriptFile <scriptFile>', 'Path to the .js script to evaluate')
        .option('-s, --script <script>', 'The script to evaluate')
        .option('-o, --screenshot <screenshotPath>', 'Grab a screenshot of the page')
        .option('-i, --interactive', 'Open an interactive non-headless Puppeteer window')
        .option('-c, --cleanup', 'Delete the user data directory after the script finishes')
        .arguments('<url>')
        .action((url) => {
            program.url = url;
        })
        .parse(process.argv);
    return {...program.opts(), url: program.url};
}

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
 * Reads the script content from options.
 * @param {Object} options - The options object containing script or scriptFile.
 * @returns {string} - The script content.
 */
function readScriptContent(options) {
    if (options.script) return options.script;
    if (!fs.existsSync(options.scriptFile)) {
        console.error(`Script file not found: ${options.scriptFile}`);
        process.exit(1);
    }
    return fs.readFileSync(options.scriptFile, 'utf8');
}

/**
 * The main function to run the script.
 * @returns {Promise<void>}
 */
(async function main() {
    const rimraf = await import('rimraf');
    const options = parseOptions();

    if (!options.scriptFile && !options.script && !options.interactive && !options.screenshot) {
        console.error('One (or more) of --scriptFile, --script, --interactive, or --screenshot option must be provided.');
        process.exit(1);
    }

    const { url, interactive } = options;
    const scriptContent = !interactive ? readScriptContent(options) : null;

    try {
        const userDataDir = path.join(os.tmpdir(), 'puppet-this_user_data');
        const browser = await launchBrowser(userDataDir, !interactive);
        const page = await browser.newPage();

        await navigateToPage(page, url);

        const result = await evaluateScript(page, scriptContent);

        if (options.screenshot) {
            await takeScreenshot(page, options.screenshot);
        }

        console.log(chalk.yellow(result));

        if (interactive) {
            spinner.info(chalk.blue('Interactive mode enabled. Please handle any interactions manually.'));
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
    } catch (err) {
        spinner.fail(chalk.red('An error occurred.'));
        console.error(chalk.red(err.message));
        process.exit(1);
    }
})();