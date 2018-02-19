const stripAnsi = require('strip-ansi')
const chalk = require('chalk')
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('../util/normalize.js')

module.exports.name = 'messages'
module.exports.description = 'List all SMS and iMessage messages in a conversation'
module.exports.requiresBackup = true

module.exports.func = function (program, base) {
  if (!program.id) {
    console.log('use -i or --id <id> to specify conversation ID.')
    process.exit(1)
  }

  // Grab the backup
  var backup = iPhoneBackup.fromID(program.backup, base)

  backup.getMessages(program.id)
    .then((items) => {
      console.log(items.length)

      program.formatter.format(items, {
        color: program.color,
        columns: {
          'ID' : el => el.ROWID,
          'Date': el => el.XFORMATTEDDATESTRING,
          'Sender': el => el.x_sender,
          'Text': el => (el.text || '').trim()
        }
      })
    })
    .catch((e) => {
      console.log('[!] Encountered an Error:', e)
    })
}
