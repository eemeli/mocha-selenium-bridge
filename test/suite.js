describe('test events', function() {
  it('this test passes', function() {
    return true
  })

  it('this test fails', function() {
    throw new Error('fail')
  })
})

describe('console capture', function() {
  it('using console.log', function() {
    console.log('log-msg', 42, { foo: 'bar' })
  })

  it('using console.error', function() {
    console.error('err-msg', new Error('log-error'))
  })

  it('logs a circular object', () => {
    var foo = {}
    var bar = { foo: foo }
    foo.bar = bar
    console.log(foo)
  })
})
