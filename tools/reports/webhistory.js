const stripAnsi = require('strip-ansi')
const { URL } = require('url')
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('../util/normalize.js')

module.exports.name = 'webhistory'
module.exports.description = 'List all web history'

module.exports.func = function (program, base) {
  if (!program.backup) {
    console.log('use -b or --backup <id> to specify backup.')
    process.exit(1)
  }

// Grab the backup
  var backup = iPhoneBackup.fromID(program.backup, base)
  if (program.dump) return backup.getWebHistory(program.dump)
  else {
    backup.getWebHistory(program.dump)
      .then((history) => {

        var items = history.map(el => [
          el.XFORMATTEDDATESTRING + '' || '',
          new URL(el.url || '').origin || '',
          (el.title || '').substring(0, 64)
        ])

        items = [['Time', 'URL', 'Title'], ['-', '-', '-'], ...items]
        items = normalizeCols(items).map(el => el.join(' | ').replace(/\n/g, '')).join('\n')

        if (!program.color) { items = stripAnsi(items) }

        console.log(items)
      })
      .catch((e) => {
        console.log('[!] Encountered an Error:', e)
      })
  }
}
