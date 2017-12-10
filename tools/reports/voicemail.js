const stripAnsi = require('strip-ansi')
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('../util/normalize.js')

module.exports.name = 'voicemail'
module.exports.description = 'List all or extract voicemails on device'

module.exports.func = function (program, base) {
  if (!program.backup) {
    console.log('use -b or --backup <id> to specify backup.')
    process.exit(1)
  }

// Grab the backup
  var backup = iPhoneBackup.fromID(program.backup, base)
  backup.getVoicemailsList()
    .then((items) => {
      if (program.dump) {
        console.log(JSON.stringify(items, null, 4))
        return
      }

      items = items.map(el => [
        el.ROWID + '',
        el.XFORMATTEDDATESTRING,
        el.sender + '',
        el.token + '',
        el.duration + '',
        el.expiration + '',
        el.trashed_date + '',
        el.flags + ''
      ])

      items = [['ID', 'Date', 'Sender', 'Token', 'Duration', 'Expiration', 'Trashed', 'Flags'], ['-', '-', '-', '-', '-', '-', '-', '-'], ...items]
      items = normalizeCols(items).map(el => el.join(' | ').replace(/\n/g, '')).join('\n')

      if (!program.color) { items = stripAnsi(items) }

      console.log(items)
    })
    .catch((e) => {
      console.log('[!] Encountered an Error:', e)
    })
}
