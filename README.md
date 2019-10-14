# mocha-selenium-bridge

This is a tool that allows you to run [Mocha] tests in browser environments from the command line, while also reporting the test results to your command line terminal. This allows you to take a pre-existing Node test suite and run it in multiple environments, or to define complex automated browser tests without needing to use the [selenium-webdriver] API.

The normal way of using Mocha and Selenium together is a bit tricky, as practically every test needs to undertake multiple operations to interact between the Node and browser environments. Our approach circumvents all of that by running Mocha entirely in the browser, and only sending the events one-way across the Selenium interface.

## Setup

First, install the package:

```
npm install --save-dev mocha-selenium-bridge
```

Next, prepare your [browser-based tests] as usual. In addition to including mocha.js, also add our `Bridge` reporter:

```html
<script src="../node_modules/mocha-selenium-bridge/browser/reporter.js"></script>
```

Alternatively, the reporter is also available via [unpkg]:

```html
<script src="https://unpkg.com/mocha-selenium-bridge/browser/reporter.js"></script>
```

If included after mocha.js, the reporter will automatically register itself. You may also register it manually:

```js
mocha.reporter(Bridge)
```

In order to further configure Mocha, you should use the [Mocha JavaScript API], as the browser instance does not support command-line options or configuration files.

## Usage

As your tests run, the Mocha test events will be queued in a buffer that'll be read by the Node part of `mocha-selenium-bridge`, and there reconstructed into corresponding events. These can then in turn be fed into any of the standard Mocha reporters.

To make that work, a CLI is provided. This command will spawn a new headless Chrome instance and open your local file `test.html` in it. Provided that it includes a `mocha.run()` call, the tests will automatically run, and on completion the browser will be closed:

```
npx mocha-selenium-bridge test.html --browser chrome
```

By default, messages logged to the browser console will be also logged to the terminal, and any calls to `console.error` will cause the test run to fail. To adjust this behaviour, use `--silent` and `--allow-console`.

For more complete documentation of the CLI, use its `--help` argument. Note in particular `--driver`, which allows you to define and build your own WebDriver for use e.g. with [BrowserStack] or other Selenium cloud providers.

## JavaScript API

```ts
import executeTests from 'mocha-selenium-bridge'

const executeTests: (driver: WebDriver, Reporter: Function, url: string, options?: {
  eventsName = '_TEST_EVENTS';
  runnerName = '_TEST_RUNNER';
  interval = 100; // buffer poll interval: 100ms
  timeout = 10000; // maximum time between events: 10s
}) => Promise<number>
```

The first three arguments are all required. `Reporter` should be a Mocha reporter; by default the CLI uses `require('mocha/lib/reporters').spec`. On success, the returned promise resolves to the count of failed tests, so may be used directly as an exit code. Your application code should take care of calling `driver.quit()` as appropriate.

[mocha]: https://mochajs.org/
[browser-based tests]: https://mochajs.org/#running-mocha-in-the-browser
[mocha javascript api]: https://mochajs.org/api/mocha
[selenium-webdriver]: https://www.npmjs.com/package/selenium-webdriver
[unpkg]: https://unpkg.com/
[browserstack]: https://www.browserstack.com/
