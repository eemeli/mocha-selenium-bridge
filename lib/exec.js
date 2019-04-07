const BridgeRunner = require('./runner')

module.exports = async function executeTests(
  driver,
  Reporter,
  url,
  {
    eventsName = '_TEST_EVENTS',
    interval = 100,
    runnerName = '_TEST_RUNNER',
    timeout = 10000
  } = {}
) {
  await driver.get(url, timeout)
  let reporter
  await new Promise((resolve, reject) => {
    let runner
    let evCount = 0
    let start = Date.now()
    const loop = setInterval(async () => {
      if (!runner) {
        const sr = await driver.executeScript(`return window["${runnerName}"];`)
        if (!sr) return
        runner = new BridgeRunner(sr)
        reporter = new Reporter(runner)
      }
      const events = await driver.executeScript(
        `return window["${eventsName}"].slice(${evCount});`
      )
      evCount += events.length
      runner.forwardEvents(events)
      if (events.some(ev => ev[0] === 'end')) {
        clearInterval(loop)
        resolve()
      } else if (events.length > 0) {
        start = Date.now()
      } else if (Date.now() > start + timeout) {
        reject(new Error('Execution loop timeout'))
      }
    }, interval)
  })
  return reporter ? reporter.failures.length : -1
}