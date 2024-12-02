#!/usr/bin/env node

import main from './main.js';
import { Command } from 'commander';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { version } = require('./package.json');

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
        .option('-f, --scriptFiles <scriptFiles>', 'Comma separated list of .js script files to evaluate')
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

main(parseOptions());