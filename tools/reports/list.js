const stripAnsi = require('strip-ansi')
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('../util/normalize.js')
const chalk = require('chalk')
const fs = require('fs-extra')

module.exports.name = 'list'
module.exports.description = 'List of all backups. alias for -l'

module.exports.func = function (program, base) {
  var items = fs.readdirSync(base, { encoding: 'utf8' })
    .filter(el => (el !== '.DS_Store'))
    .map(file => iPhoneBackup.fromID(file, base))
    .filter(el => el.manifest && el.status)

  program.formatter.format(items, {
    color: program.color,
    columns: {
      'UDID': el => el.id,
      'Encryption': el => el.manifest ? el.manifest.IsEncrypted
                                      ? chalk.green('encrypted')
                                        : chalk.red('not encrypted')
                                      : 'unknown encryption',
      'Date': el => el.status ? new Date(el.status.Date).toLocaleString() : '',
      'Device Name': el => el.manifest ? el.manifest.Lockdown.DeviceName : 'Unknown Device',
      'Serial #': el => el.manifest.Lockdown.SerialNumber,
      'iOS Version': el => el.manifest ? el.manifest.Lockdown.ProductVersion : '?',
      'Backup Version': el => el.status ? el.status.Version : '?'
    }
  })
}
