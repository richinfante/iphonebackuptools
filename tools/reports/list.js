const stripAnsi = require('strip-ansi')
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('../util/normalize.js')
const chalk = require('chalk')
const fs = require('fs-extra')

module.exports.name = 'list'
module.exports.description = 'List of all backups. alias for -l'


// Specify this reporter requires a backup. 
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = false

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = function (program, base, resolve, reject) {
  var items = fs.readdirSync(base, { encoding: 'utf8' })
    .filter(el => (el !== '.DS_Store'))
    .map(file => iPhoneBackup.fromID(file, base))
    .filter(el => el.manifest && el.status)

  var output = program.formatter.format(items, {
    program: program,
    columns: {
      'UDID': el => el.id,
      'Encryption': el => el.manifest ? (el.manifest.IsEncrypted ? 'encrypted' : 'not encrypted') : 'unknown',
      'Date': el => el.status ? new Date(el.status.Date).toLocaleString() : '',
      'Device Name': el => el.manifest ? el.manifest.Lockdown.DeviceName : 'Unknown Device',
      'Serial #': el => el.manifest.Lockdown.SerialNumber,
      'iOS Version': el => el.manifest ? el.manifest.Lockdown.ProductVersion : '?',
      'Backup Version': el => el.status ? el.status.Version : '?'
    }
  })

  resolve(output)
}
