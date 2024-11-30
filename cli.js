#!/usr/bin/env node

import puppeteer from 'puppeteer';
import fs from 'fs';
import { Command } from 'commander';
import os from 'os';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';

/**
 * Launches a Puppeteer browser instance.
 * @param {string} userDataDir - The directory for user data.
 * @param {ora.Ora} spinner - The spinner instance for status updates.
 * @returns {Promise<puppeteer.Browser>}
 */
async function launchBrowser(userDataDir, spinner) {
    spinner.start(chalk.blue('Launching browser...'));
    const browser = await puppeteer.launch({ userDataDir });
    spinner.succeed(chalk.green('Browser launched.'));
    return browser;
}

/**
 * Navigates to a specified URL using a Puppeteer page instance.
 * @param {puppeteer.Page} page - The Puppeteer page instance.
 * @param {string} url - The URL to navigate to.
 * @param {ora.Ora} spinner - The spinner instance for status updates.
 * @returns {Promise<void>}
 */
async function navigateToPage(page, url, spinner) {
    spinner.start(chalk.blue(`Navigating to ${url}...`));
    await page.goto(url, { waitUntil: 'networkidle0' });
    spinner.succeed(chalk.green(`Navigated to ${url}.`));
}

/**
 * Evaluates a script on a Puppeteer page instance.
 * @param {puppeteer.Page} page - The Puppeteer page instance.
 * @param {string} scriptContent - The script content to evaluate.
 * @param {ora.Ora} spinner - The spinner instance for status updates.
 * @returns {Promise<any>}
 */
async function evaluateScript(page, scriptContent, spinner) {
    spinner.start(chalk.blue('Evaluating script on the page...'));
    const result = await page.evaluate(new Function(scriptContent));
    spinner.succeed(chalk.green('Script evaluated.'));

    return result;
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
 * Sets up the command-line interface using Commander.
 * @returns {Command} - The configured Commander program.
 */
function setupCommand() {
    const program = new Command();
    program
        .name('puppeteer-script-runner')
        .description('Evaluate a .js script on a webpage using Puppeteer')
        .version('1.0.4')
        .option('-f, --scriptFile <scriptFile>', 'Path to the .js script to evaluate')
        .option('-s, --script <script>', 'The script to evaluate')
        .arguments('<url>')
        .action((url) => {
            program.url = url;
        })
        .parse(process.argv);
    return program;
}

/**
 * The main function to run the script.
 * @returns {Promise<void>}
 */
(async function main() {
    const rimraf = await import('rimraf');
    const program = setupCommand();
    const options = program.opts();
    const spinner = ora();

    if (!options.scriptFile && !options.script) {
        console.error('Either --scriptFile or --script option must be provided.');
        process.exit(1);
    }

    if (options.scriptFile && options.script) {
        console.error('Only one of --scriptFile or --script option should be provided.');
        process.exit(1);
    }

    const { url } = program;
    const scriptContent = readScriptContent(options);

    try {
        const userDataDir = path.join(os.tmpdir(), 'puppeteer_user_data');
        const browser = await launchBrowser(userDataDir, spinner);
        const page = await browser.newPage();

        await navigateToPage(page, url, spinner);
        const result = await evaluateScript(page, scriptContent, spinner);
        await browser.close();

        console.log(chalk.yellow(result));

        rimraf.sync(userDataDir);
    } catch (err) {
        spinner.fail(chalk.red('An error occurred.'));
        console.error(chalk.red(err.message));
        process.exit(1);
    }
})();