const checkConsoleCalls = require('./console')
const BridgeRunner = require('./runner')

module.exports = async function executeTests(
  driver,
  Reporter,
  url,
  {
    allowConsole,
    eventsName = '_TEST_EVENTS',
    interval = 100,
    runnerName = '_TEST_RUNNER',
    silent,
    timeout = 10000
  } = {}
) {
  await driver.get(url, timeout)

  let runner
  let reporter
  await new Promise((resolve, reject) => {
    let evCount = 0
    let start = Date.now()
    const handleEvents = async () => {
      if (!runner) {
        const sr = await driver.executeScript(`return window["${runnerName}"];`)
        if (!sr) {
          if (Date.now() > start + timeout)
            reject(new Error('Bridge init timeout'))
          else setTimeout(handleEvents, interval)
          return
        }
        runner = new BridgeRunner(sr, { silent })
        reporter = new Reporter(runner)
      }
      const events = await driver.executeScript(
        `return window["${eventsName}"].slice(${evCount});`
      )
      evCount += events.length
      runner.forwardEvents(events)
      if (events.some(ev => ev[0] === 'end')) {
        return resolve()
      } else if (events.length > 0) {
        start = Date.now()
      } else if (Date.now() > start + timeout) {
        return reject(new Error('Execution loop timeout'))
      }
      setTimeout(handleEvents, interval)
    }
    handleEvents()
  })
  if (!reporter) return -1

  const fc = reporter.failures.length
  const cc = checkConsoleCalls(runner.console, allowConsole)
  return fc + cc
}
