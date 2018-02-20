const stripAnsi = require('strip-ansi')
const chalk = require('chalk')
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('../util/normalize.js')

module.exports.name = 'conversations'
module.exports.description = 'List all SMS and iMessage conversations'

// Specify this reporter requires a backup. 
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = function (program, backup, resolve, reject) {
  backup.getConversations()
    .then((items) => {

      var result = program.formatter.format(items, {
        program: program,
        columns: {
          'ID': el => el.ROWID,
          'Date': el => el.XFORMATTEDDATESTRING || '??',
          'Service': el => el.service_name + '',
          'Chat Name': el => el.chat_identifier + '',
          'Display Name': el => el.display_name + '',
        }
      })

      resolve(result)
    })
    .catch(reject)
}
