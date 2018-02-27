const log = require('../util/log')

module.exports.name = 'messages'
module.exports.description = 'List all SMS and iMessage messages in a conversation'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

// Should this report be skipped in automated reports?
// This is used when the 'all' report type is specified, and all possible reports are generated.
// with this set to true, the report WILL NOT run when report type = 'all'
module.exports.requiresInteractivity = true

module.exports.func = function (program, backup, resolve, reject) {
  if (!program.id) {
    log.error('use -i or --id <id> to specify conversation ID.')
    process.exit(1)
  }

  backup.getMessages(program.id)
    .then((items) => {
      var result = program.formatter.format(items, {
        program: program,
        columns: {
          'ID': el => el.ROWID,
          'Date': el => el.XFORMATTEDDATESTRING,
          'Sender': el => el.x_sender,
          'Text': el => (el.text || '').trim()
        }
      })

      resolve(result)
    })
    .catch(reject)
}
