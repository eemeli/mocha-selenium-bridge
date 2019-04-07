#!/usr/bin/env node

const reporters = require('mocha/lib/reporters')
const path = require('path')
const { Builder } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const firefox = require('selenium-webdriver/firefox')
const exec = require('./exec')

const requireFromCwd = fn => {
  if (fn[0] === '.') fn = path.resolve(process.cwd(), fn)
  return require(fn)
}

const argv = require('yargs')
  .scriptName('mocha-selenium-bridge')
  .options({
    browser: {
      alias: 'b',
      choices: ['chrome', 'edge', 'firefox', 'ie', 'safari'],
      describe: 'May also be set by SELENIUM_BROWSER env var'
    },
    driver: {
      alias: 'd',
      conflicts: 'browser',
      describe: 'Path to script exporting a WebDriver instance',
      type: 'string'
    },
    headless: {
      default: true,
      describe:
        'Run Chrome or Firefox in headless mode; use --no-headless to disable',
      type: 'boolean'
    },
    reporter: {
      coerce: arg => reporters[arg] || requireFromCwd(arg),
      default: 'spec',
      describe: 'Mocha reporter, or path to script exporting it',
      type: 'string'
    },
    timeout: {
      default: 10000,
      describe: 'Timeout for browser actions in ms',
      type: 'number'
    }
  })
  .command(
    '$0 <url>',
    'Run the test suite defined at <url>',
    () => {},
    ({ browser, driver, headless, reporter, timeout, url }) => {
      const webDriver = driver
        ? requireFromCwd(driver)
        : new Builder()
            .forBrowser(browser)
            .setChromeOptions(headless && new chrome.Options().headless())
            .setFirefoxOptions(headless && new firefox.Options().headless())
            .build()
      if (!url.includes('://')) {
        url = 'file://' + path.posix.resolve(process.cwd(), url)
      }
      exec(webDriver, reporter, url, { timeout })
        .catch(err => {
          console.error(err)
          return -2
        })
        .then(async code => {
          await webDriver.quit(timeout)
          process.exit(code || 0)
        })
    }
  ).argv
