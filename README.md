# Puppet This
Puppet This is a very simple command-line tool designed to automate extracting stuff from webpages, where everyones favourite (curl + sed) might be a bit cumbersome, or impossible because it's changed onload.

That's where puppeteer comes in handy.
This tool provides a quick way of throwing puppeteer at a URL, injecting a javscript and logging what's returned.

This is useful for scraping small bits of data from specific pages of websites for testing or comparison.

## Example usage
### Using --script
```bash
puppet-this https://github.com/fisknils/puppet-this-cli \
    --script "return document.querySelector('#repo-stars-counter-star').innerText;"
```

### Using --file
```bash
puppet-this https://github.com/fisknils/puppet-this-cli \
    -f ./my-scripts/get-github-stars.js
```

## Installation
```npm -g i puppet-this```

## License
uhmm.. MIT I guess? do whatever you want with it!