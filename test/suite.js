describe('test events', function() {
  it('this test passes', function() {
    return true
  })

  it('this test fails', function() {
    throw new Error('fail')
  })
})

describe('console capture', function() {
  it('this test uses console.log', function() {
    console.log('log-msg', 42, { foo: 'bar' })
  })

  it('this test uses console.error', function() {
    console.error('err-msg', new Error('log-error'))
  })
})
