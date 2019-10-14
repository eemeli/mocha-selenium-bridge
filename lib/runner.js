const EventEmitter = require('events')

function unpack(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(unpack)
  const res = {}
  for (const key of Object.keys(obj)) {
    if (key[0] === '_') res[key.substr(1)] = () => obj[key]
    else res[key] = unpack(obj[key])
  }
  return res
}

function reviver(key, value) {
  if (value && typeof value === 'object' && '_TEST_ERROR' in value) {
    const error = new Error(value._TEST_ERROR)
    Object.assign(error, value)
    delete error._TEST_ERROR
    return error
  }
  return value
}

class BridgeRunner extends EventEmitter {
  constructor(runner, { silent } = {}) {
    super()
    Object.assign(this, unpack(runner))
    this.console = { echo: !silent, log: 0, warn: 0, error: 0 }
  }

  forwardEvents(events) {
    for (const ev of events) {
      switch (ev[0]) {
        case 'console': {
          const method = ev[1]
          this.console[method] += 1
          if (this.console.echo) {
            const args = ev.slice(2).map(v => JSON.parse(v, reviver))
            console[method].apply(null, args)
          }
          break
        }
        case 'stats':
          Object.assign(this.stats, ev[1])
          break
        default:
          this.emit.apply(this, ev.map(unpack))
      }
    }
  }
}

module.exports = BridgeRunner
