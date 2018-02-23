const tap = require('tap')
const version = require('../tools/util/version_compare')

tap.test('version', function (childTest) {
    childTest.equal(version.versionCheck('9.1', '=9.1'), true)
    childTest.equal(version.versionCheck('9.1', '<=9.1'), true)
    childTest.equal(version.versionCheck('9.1', '>=9.1'), true)
    childTest.equal(version.versionCheck('10.0', '<=9.1'), false)
    childTest.equal(version.versionCheck('10.0', '<9.1'), false)
    childTest.equal(version.versionCheck('10.0', '>9.1'), true)
    childTest.equal(version.versionCheck('10.0', '>=9.1'), true)
    childTest.end()
})