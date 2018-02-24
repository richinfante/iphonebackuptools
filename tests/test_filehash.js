const tap = require('tap')
const fileHash = require('../tools/util/backup_filehash')

tap.test('hashes', function (childTest) {
  childTest.equal(fileHash('Library/SMS/sms.db'), '3d0d7e5fb2ce288813306e4d4636395e047a3d28')

  childTest.equal(
    fileHash('SystemConfiguration/com.apple.wifi.plist', 'SystemPreferencesDomain'), 'ade0340f576ee14793c607073bd7e8e409af07a8'
  )

  childTest.end()
})
