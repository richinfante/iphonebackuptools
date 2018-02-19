const stripAnsi = require('strip-ansi')
const { URL } = require('url')
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('../util/normalize.js')

module.exports.name = 'webhistory'
module.exports.description = 'List all web history'

// Specify this reporter requires a backup. 
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this only works for iOS 6+
module.exports.supportedVersions = '>=9.0'

module.exports.func = function (program, backup) {

  backup.getWebHistory(program.dump)
    .then((history) => {
      
      program.formatter.format(history, {
        color: program.color,
        columns: {
          'Time': el => el.XFORMATTEDDATESTRING,
          'URL': el => new URL(el.url || '').origin || '',
          'Title': el => (el.title || '').substring(0, 64)
        }
      })
    })
    .catch((e) => {
      console.log('[!] Encountered an Error:', e)
    })
}
