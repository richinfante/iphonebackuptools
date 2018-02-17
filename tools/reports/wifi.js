const stripAnsi = require('strip-ansi')
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('../util/normalize.js')
const zpad = require('zpad')

module.exports.name = 'wifi'
module.exports.description = 'List associated wifi networks and their usage information'

// Specify this reporter requires a backup. 
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = function (program, backup, resolve, reject) {

  backup.getWifiList()
    .then((items) => {

      var result = program.formatter.format(items['List of known networks'], {
        program: program,
        columns: {
          'Last Joined': el => el.lastJoined,
          'Last AutoJoined': el => el.lastAutoJoined,
          'SSID': el => el.SSID_STR,
          'BSSID': el => el.BSSID,
          'Security': el => el.SecurityMode || '',
          'Hidden': el => el.HIDDEN_NETWORK || '',
          'Enabled': el => el.enabled
        }
      })

      resolve(result)
    })
    .catch(reject)
}
