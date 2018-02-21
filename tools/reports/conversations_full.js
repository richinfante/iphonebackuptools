const stripAnsi = require('strip-ansi')
const chalk = require('chalk')
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('../util/normalize.js')

module.exports.name = 'conversations_full'
module.exports.description = 'List all SMS and iMessage conversations and their messages (dump only)'

module.exports.func = function (program, base) {
  if (!program.backup) {
    console.log('use -b or --backup <id> to specify backup.')
    process.exit(1)
  }

  // Grab the backup
  var backup = iPhoneBackup.fromID(program.backup, base)

  if (program.dump) {
    return new Promise(async (resolve, reject) => {
      let conversations = await backup.getConversations();
      for (let el of conversations) {
        el.messages = await backup.getMessages(el.ROWID, true);
      }
      
      resolve(conversations);
    });
  } 
  else {
    backup.getConversations(program.dump)
      .then((items) => {
        items = items.map(el => [
          el.ROWID + '',
          chalk.gray(el.XFORMATTEDDATESTRING || '??'),
          el.service_name + '', 
          el.chat_identifier + '',
          el.display_name + ''
        ])

        items = [['ID', 'DATE', 'Service', 'Chat Name', 'Display Name'], ['-', '-', '-', '-', '-'], ...items]
        items = normalizeCols(items).map(el => el.join(' | ')).join('\n')

        if (!program.color) { items = stripAnsi(items) }

        console.log(items)
      })
      .catch((e) => {
        console.log('[!] Encountered an Error:', e)
      })
  }
}
