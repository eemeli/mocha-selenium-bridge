const { color } = require('mocha').reporters.Base

function checkConsoleCalls(counts, allowConsole) {
  let total, message
  switch (allowConsole) {
    case 'none':
      total = counts.log + counts.warn + counts.error
      message = 'All browser console logging is forbidden'
      break
    case 'log':
      total = counts.warn + counts.error
      message = 'Browser console.{warn,error} calls are not allowed'
      break
    case 'warn':
      total = counts.error
      message = 'Browser console.error calls are not allowed'
      break
    case 'error':
    default:
      total = 0
  }
  if (total > 0) {
    const fmtMsg = color('fail', message)
    const fmtCount = color(
      'error stack',
      total > 1 ? `(${total} calls)` : '(1 call)'
    )
    console.log(`${fmtMsg} ${fmtCount}\n`)
  }
  return total
}

module.exports = checkConsoleCalls
