const tap = require('tap')
const macParse = require('../tools/util/mac_address_parse')

tap.test('mac-normalize', function (childTest) {
  childTest.equal(macParse.pad_zeros('ff:1:22:10'), 'ff:01:22:10')
  childTest.equal(macParse.pad_zeros('ff:01:22:10'), 'ff:01:22:10')

  childTest.end()
})
