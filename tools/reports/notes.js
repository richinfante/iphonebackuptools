const stripAnsi = require('strip-ansi')
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('../util/normalize.js')

module.exports.name = 'notes'
module.exports.description = 'List all iOS notes'

module.exports.func = function (program, base) {
  if (!program.backup) {
    console.log('use -b or --backup <id> to specify backup.')
    process.exit(1)
  }

// Grab the backup
  var backup = iPhoneBackup.fromID(program.backup, base)
  backup.getNotes(program.dump)
    .then((items) => {
        // Dump if needed
      if (program.dump) {
        console.log(JSON.stringify(items, null, 4))
        return
      }

        // Otherwise, format table
      items = items.map(el => [
        (el.XFORMATTEDDATESTRING || el.XFORMATTEDDATESTRING1) + '',
            (el.Z_PK + ''),
        (el.ZTITLE2 + '').trim().substring(0, 128),
        (el.ZTITLE1 + '').trim() || ''
      ])
      items = [['Modified', 'ID', 'Title2', 'Title1'], ['-', '-', '-', '-'], ...items]
      items = normalizeCols(items, 3).map(el => el.join(' | ')).join('\n')

      if (!program.color) { items = stripAnsi(items) }

      console.log(items)
    })
    .catch((e) => {
      console.log('[!] Encountered an Error:', e)
    })
}
