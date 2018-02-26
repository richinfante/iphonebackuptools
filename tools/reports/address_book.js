const stripAnsi = require('strip-ansi')
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('../util/normalize.js')

module.exports.name = 'address_book'
module.exports.description = 'List all iOS Address Book contents'

module.exports.func = function (program, base) {
  if (!program.backup) {
    console.log('use -b or --backup <id> to specify backup.')
    process.exit(1)
  }

  // Grab the backup
  var backup = iPhoneBackup.fromID(program.backup, base)
  return backup.getAddressBook()
  /*
  if (program.dump) return backup.getAddressBook()
  else {
    backup.getNotes(program.dump)
      .then((items) => {
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
  }*/
}
