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

    // Possibly dump output
  if (program.dump) {
    return items
  }

  items = items.map(el => {
    if (!el.manifest || !el.status) { return null }
    return {
      encrypted: el.manifest ? el.manifest.IsEncrypted
                                    ? chalk.green('encrypted')
                                    : chalk.red('not encrypted')
                            : 'unknown encryption',
      device_name: el.manifest ? el.manifest.Lockdown.DeviceName : 'Unknown Device',
      device_id: el.id,
      serial: el.manifest.Lockdown.SerialNumber,
      iOSVersion: el.manifest.Lockdown.ProductVersion + '(' + el.manifest.Lockdown.BuildVersion + ')',
      backupVersion: el.status ? el.status.Version : '?',
      date: el.status ? new Date(el.status.Date).toLocaleString() : ''
    }
  })
  .filter(el => el != null)
  .map(el => [
    chalk.gray(el.device_id),
    el.encrypted,
    el.date,
    el.device_name,
    el.serial,
    el.iOSVersion,
    el.backupVersion
  ])

  items = [
    ['UDID', 'Encryption', 'Date', 'Device Name', 'Serial #', 'iOS Version', 'Backup Version'],
    ['-', '-', '-', '-', '-', '-', '-'],
    ...items
  ]
  items = normalizeCols(items)
  items = items.map(el => el.join(' | ')).join('\n')

  if (!program.color) { items = stripAnsi(items) }

  console.log(items)
}
