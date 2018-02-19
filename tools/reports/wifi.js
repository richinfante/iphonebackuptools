const stripAnsi = require('strip-ansi')
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('../util/normalize.js')

module.exports.name = 'wifi'
module.exports.description = 'List associated wifi networks and their usage information'

module.exports.func = function (program, base) {
  if (!program.backup) {
    console.log('use -b or --backup <id> to specify backup.')
    process.exit(1)
  }

// Grab the backup
  var backup = iPhoneBackup.fromID(program.backup, base)
  backup.getWifiList()
    .then((items) => {

      program.formatter.format(items['List of known networks'], {
        color: program.color,
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
    })
    .catch((e) => {
      console.log('[!] Encountered an Error:', e)
    })
}
