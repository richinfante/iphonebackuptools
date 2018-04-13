const fs = require('fs-extra')

module.exports = {
  version: 3,
  name: 'list',
  description: 'List of all backups',

  run (lib, params) {
    return new Promise(async (resolve, reject) => {
      let files = fs.readdirSync(lib.base, { encoding: 'utf8' })
        .filter(el => (el !== '.DS_Store'))

      var results = []

      // Iterate over the file list and try to get statuses for each backup.
      for (let id of files) {
        var result = { id }

        try {
          result.status = await lib.run('backup.status', { backup: id })
        } catch (e) {}

        try {
          result.info = await lib.run('backup.info', { backup: id })
        } catch (e) {}

        try {
          result.manifest = await lib.run('backup.manifest', { backup: id })
        } catch (e) {}

        results.push(result)
      }

      resolve(results)
    })
  },

  localizations: {
    'UDID': el => el.id,
    'Encryption': el => el.manifest ? (el.manifest.IsEncrypted ? 'encrypted' : 'not encrypted') : 'unknown',
    'Date': el => el.status ? new Date(el.status.Date).toLocaleString() : '',
    'Device Name': el => el.manifest ? el.manifest.Lockdown.DeviceName : 'Unknown Device',
    'Serial #': el => el.manifest.Lockdown.SerialNumber,
    'iOS Version': el => el.manifest ? el.manifest.Lockdown.ProductVersion : '?',
    'Backup Version': el => el.status ? el.status.Version : '?'
  }
}

/*
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup

const chalk = require('chalk')

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
    columns:
  })

  resolve(output)
}
*/
