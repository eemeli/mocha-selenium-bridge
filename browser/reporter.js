var events = []

function Bridge(runner) {
  function simpleError(err) {
    return {
      actual: err.actual,
      expected: err.expected,
      htmlMessage: err.htmlMessage,
      line: err.line,
      message: err.message,
      showDiff: err.showDiff,
      sourceURL: err.sourceURL,
      stack: err.stack,
      _toString: err.toString()
    }
  }

  function simpleTest(test) {
    return {
      body: test.body,
      duration: test.duration,
      parent: { _fullTitle: test.parent.fullTitle() },
      state: test.state,
      title: test.title,
      _currentRetry: test.currentRetry(),
      _fullTitle: test.fullTitle(),
      _isPending: test.isPending(),
      _slow: test.slow(),
      _titlePath: test.titlePath()
    }
  }

  function simpleSuite(suite) {
    return {
      root: suite.root,
      suites: suite.suites.map(simpleSuite),
      tests: suite.tests.map(simpleTest),
      title: suite.title,
      _fullTitle: suite.fullTitle()
    }
  }

  function simpleRunner(runner) {
    return {
      stats: runner.stats,
      suite: simpleSuite(runner.suite),
      total: runner.total,
      _grepTotal: runner.grepTotal(runner.suite) // hack for TAP reporter
    }
  }

  function plainEvent(name) {
    return function () {
      events.push([name])
    }
  }

  function suiteEvent(name) {
    return function (suite) {
      events.push([name, simpleSuite(suite)])
    }
  }

  function testEvent(name) {
    return function (test, err) {
      var ev = [name, simpleTest(test)]
      if (err) ev.push(simpleError(err))
      events.push(ev)
    }
  }

  // constants from from mocha/lib/runner.js
  // var EVENT_HOOK_BEGIN = 'hook'
  // var EVENT_HOOK_END = 'hook end'
  var EVENT_RUN_BEGIN = 'start'
  var EVENT_DELAY_BEGIN = 'waiting'
  var EVENT_DELAY_END = 'ready'
  var EVENT_RUN_END = 'end'
  var EVENT_SUITE_BEGIN = 'suite'
  var EVENT_SUITE_END = 'suite end'
  var EVENT_TEST_BEGIN = 'test'
  var EVENT_TEST_END = 'test end'
  var EVENT_TEST_FAIL = 'fail'
  var EVENT_TEST_PASS = 'pass'
  var EVENT_TEST_PENDING = 'pending'
  var EVENT_TEST_RETRY = 'retry'

  var handlers = [
    [EVENT_RUN_BEGIN, plainEvent],
    [EVENT_DELAY_BEGIN, suiteEvent],
    [EVENT_DELAY_END, plainEvent],
    [EVENT_RUN_END, plainEvent],
    [EVENT_SUITE_BEGIN, suiteEvent],
    [EVENT_SUITE_END, suiteEvent],
    [EVENT_TEST_BEGIN, testEvent],
    [EVENT_TEST_END, testEvent],
    [EVENT_TEST_FAIL, testEvent],
    [EVENT_TEST_PASS, testEvent],
    [EVENT_TEST_PENDING, testEvent],
    [EVENT_TEST_RETRY, testEvent]
  ]

  window._TEST_EVENTS = events
  window._TEST_RUNNER = simpleRunner(runner)

  runner.on(EVENT_RUN_END, function () {
    events.push(['stats', runner.stats])
  })

  for (var i = 0; i < handlers.length; ++i) {
    var key = handlers[i][0]
    var handler = handlers[i][1]
    runner.on(key, handler(key))
  }

  function packError(error) {
    var obj = { _TEST_ERROR: error.message }
    if (error.name !== 'Error') obj.name = error.name
    var keys = Object.keys(error)
    for (var i = 0; i < keys.length; ++i) {
      var key = keys[i]
      obj[key] = error[key]
    }
    obj.stack = error.stack
    return obj
  }

  function capture(method) {
    var orig = console[method]
    return function () {
      var ev = ['console', method]
      for (var j = 0; j < arguments.length; ++j) {
        var arg = arguments[j]
        var obj = arg instanceof Error ? packError(arg) : arg
        try {
          ev.push(JSON.stringify(obj))
        } catch (error) {
          ev.push(JSON.stringify(packError(error)))
        }
      }
      events.push(ev)
      orig.apply(null, arguments)
    }
  }

  console.error = capture('error')
  console.log = capture('log')
  console.warn = capture('warn')
}

if (mocha) mocha.reporter(Bridge)
