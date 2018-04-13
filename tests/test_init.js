const tap = require('tap')

tap.test('version', function (childTest) {
  // Require it to check if we can load the module
  require('../tools/index')
  childTest.end()
})
