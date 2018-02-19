const stripAnsi = require('strip-ansi')
const chalk = require('chalk')
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('../util/normalize.js')

module.exports.name = 'conversations'
module.exports.description = 'List all SMS and iMessage conversations'

module.exports.func = function (program, base) {
  if (!program.backup) {
    console.log('use -b or --backup <id> to specify backup.')
    process.exit(1)
  }

  // Grab the backup
  var backup = iPhoneBackup.fromID(program.backup, base)

  backup.getConversations()
    .then((items) => {

      program.formatter.format(items, {
        color: program.color,
        columns: {
          'ID': el => el.ROWID,
          'Date': el => el.XFORMATTEDDATESTRING || '??',
          'Service': el => el.service_name + '',
          'Chat Name': el => el.chat_identifier + '',
          'Display Name': el => el.display_name + '',
        }
      })
    })
    .catch((e) => {
      console.log('[!] Encountered an Error:', e)
    })
}
