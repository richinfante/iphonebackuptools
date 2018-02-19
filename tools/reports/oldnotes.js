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
  backup.getOldNotes(program.dump)
    .then((items) => {

      program.formatter.format(items, {
        color: program.color,
        columns: {
          'Modified': el => el.XFORMATTEDDATESTRING,
          'ID': el => el.Z_PK,
          'Title': el => (el.ZTITLE + '').substring(0, 128)
        }
      })
    })
    .catch((e) => {
      console.log('[!] Encountered an Error:', e)
    })
}
