# Puppet This
Puppet This is a very simple command-line tool designed to automate web tasks using Puppeteer. It allows you to evaluate JavaScript scripts on web pages with a real (headless) browser, thanks to puppeteer.

Whatever your custom script *returns* will be logged out in the console. This is useful for scraping data from websites, automating tasks, or testing web pages.


## Table of Contents
- [Description](#description)
- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Contributing](#contributing)
- [License](#license)

## Why?
I'm a browser dev-tools enthusiast and I love to play around with scripts to grab data from sites.
Sometimes, I find myself writing and rerunning the same script on the same page, just to get an updated link collection or comment count.
So I wanted to be able to save my scripts and maybe even automate some of them.

## Example usage

### Using --script
```bash
puppet-this https://github.com/fisknils/puppet-this-cli \
    --script "return document.querySelector('#repo-stars-counter-star').innerText;"
```

### Using --file
```bash
puppet-this https://github.com/fisknils/puppet-this-cli -f ./my-scripts/get-github-stars.js
```

## Installation
```npm -g i https://github.com/fisknils/puppet-this-cli.git```
