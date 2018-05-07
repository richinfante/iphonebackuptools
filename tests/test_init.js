const tap = require('tap')

tap.test('version', function (childTest) {
  // Require it to check if we can load the modules
  require('../tools/index')
  require('../tools/cli')
  childTest.end()
})
