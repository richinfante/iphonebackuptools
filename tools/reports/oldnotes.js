const stripAnsi = require('strip-ansi')
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('../util/normalize.js')

module.exports.name = 'oldnotes'
module.exports.description = 'List all iOS notes (from older unused database)'

module.exports.func = function (program, base) {
  if (!program.backup) {
    console.log('use -b or --backup <id> to specify backup.')
    process.exit(1)
  }

  // Grab the backup
  var backup = iPhoneBackup.fromID(program.backup, base)
  if (program.dump) return backup.getOldNotes(program.dump)
  else {
    backup.getOldNotes(program.dump)
      .then((items) => {
        // Dump if needed
        if (program.dump) {
          return items
        }

        // Otherwise, format table
        items = items.map(el => [el.XFORMATTEDDATESTRING + '', (el.Z_PK + ''), (el.ZTITLE + '').substring(0, 128)])
        items = [
          ['Modified', 'ID', 'Title'],
          ['-', '-', '-'], ...items
        ]
        items = normalizeCols(items).map(el => el.join(' | ')).join('\n')

        if (!program.color) {
          items = stripAnsi(items)
        }

        console.log(items)
      })
      .catch((e) => {
        console.log('[!] Encountered an Error:', e)
      })
  }
}
