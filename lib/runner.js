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

class BridgeRunner extends EventEmitter {
  constructor(runner) {
    super()
    Object.assign(this, unpack(runner))
  }

  forwardEvents(events) {
    for (const ev of events) {
      if (ev[0] === 'stats') Object.assign(this.stats, ev[1])
      else this.emit.apply(this, ev.map(unpack))
    }
  }
}

module.exports = BridgeRunner
