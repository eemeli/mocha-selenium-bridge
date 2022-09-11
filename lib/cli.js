#!/usr/bin/env node

const fs = require('fs')
const reporters = require('mocha/lib/reporters')
const path = require('path')
const { Builder } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const firefox = require('selenium-webdriver/firefox')
const YAML = require('yaml')

const executeTests = require('./exec')

const requireFromCwd = (fn) => {
  if (fn[0] === '.') fn = path.resolve(process.cwd(), fn)
  return require(fn)
}

require('yargs')
  .scriptName('mocha-selenium-bridge')
  .config(
    'config',
    'Path to a JSON or YAML config file. The "mocha-selenium-bridge" key of your package.json may also be used.',
    (cfgPath) => YAML.parse(fs.readFileSync(cfgPath, 'utf8'))
  )
  .alias('config', 'c')
  .pkgConf('mocha-selenium-bridge')
  .options({
    browser: {
      alias: 'b',
      choices: ['chrome', 'edge', 'firefox', 'ie', 'safari'],
      describe: 'Local browser; may also be set by SELENIUM_BROWSER env var'
    },
    driver: {
      alias: 'd',
      conflicts: 'browser',
      describe: 'Path to script exporting a WebDriver instance'
    },
    'allow-console': {
      alias: 'a',
      choices: ['none', 'log', 'warn', 'error'],
      default: 'warn',
      describe:
        'Maximum level of console logging allowed for a passing test run.'
    },
    headless: {
      default: true,
      describe:
        'Run local Chrome or Firefox in headless mode; use --no-headless to disable',
      type: 'boolean'
    },
    reporter: {
      coerce: (arg) => reporters[arg] || requireFromCwd(arg),
      default: 'spec',
      describe: 'Mocha reporter name, or path to script exporting it'
    },
    silent: {
      alias: 's',
      describe: 'Do not echo the browser console to the terminal',
      type: 'boolean'
    },
    timeout: {
      default: 10000,
      describe: 'Timeout for browser actions in ms',
      type: 'number'
    }
  })
  .check((argv) => {
    if (!argv.url) throw new Error('The url argument is required')
    return true
  })
  .command(
    '$0 [url]',
    'Run the test suite defined at [url] in a browser, and report the results here.',
    () => {},
    ({
      allowConsole,
      browser,
      driver,
      headless,
      reporter,
      silent,
      timeout,
      url
    }) => {
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
      executeTests(webDriver, reporter, url, { allowConsole, silent, timeout })
        .catch((err) => {
          console.error(err)
          return -2
        })
        .then(async (code) => {
          await webDriver.quit(timeout)
          process.exit(code || 0)
        })
    }
  ).argv
