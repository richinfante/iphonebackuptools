const stripAnsi = require('strip-ansi')
const chalk = require('chalk')
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('../util/normalize.js')

module.exports.name = 'messages'
module.exports.description = 'List all SMS and iMessage messages in a conversation'

module.exports.func = function (program, base) {
  if (!program.backup) {
    console.log('use -b or --backup <id> to specify backup.')
    process.exit(1)
  }

  // Grab the backup
  var backup = iPhoneBackup.fromID(program.backup, base)

  backup.getMessages(program.messages, program.dump)
    .then((items) => {
      if (program.dump) return

      items = items.map(el => [
        chalk.gray(el.XFORMATTEDDATESTRING + ''),
        chalk.blue(el.x_sender + ''),
        el.text || ''
      ])

      items = normalizeCols(items, 2).map(el => el.join(' | ')).join('\n')

      if (!program.color) { items = stripAnsi(items) }

      console.log(items)
    })
    .catch((e) => {
      console.log('[!] Encountered an Error:', e)
    })
}
