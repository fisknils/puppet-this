#!/usr/bin/env node
// anchor, now!
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

    const program = (() =>new Commander())()
        .name('puppet-this')
        .description('Evaluate a .js script on a webpage using Puppeteer')
        .option('-is, --internal-script <path to script>', 'This custom script will be evaluated by node, as opposed to the browser. (one level "higher")')
        .option('-s, --scripts <path to scripts>', 'Comma separated list of .js script files to evaluate')
        .option('--screenshot <screenshotPath>[,<screenshotComparePath>,<diffOutputPath>', 'Grab a screenshot of the page. If comparePath or diffOutputPath are passed, also does visual regression testing.')
        .option('-i, --interactive', 'Open an interactive non-headless Puppeteer window, to set cookies the old fashioned way (as an actual visitor).')
        .option('-c, --cleanup', 'Add this flag to delete the user data directory after the script finishes. Clears any changes made in interactive mode.')
        .option('-q, --quiet', 'Suppress spinner output')
        .arguments('<url>')
        .action(url => program.url = url)
        .parse(process.argv);

    return {...program.opts(), url: program.url};
}

main(parseOptions());