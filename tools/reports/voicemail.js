module.exports.name = 'voicemail'
module.exports.description = 'List all or extract voicemails on device'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

// Specify this only works for iOS 9+
module.exports.supportedVersions = '>=9.0'

module.exports.func = function (program, backup, resolve, reject) {
  backup.getVoicemailsList()
    .then((items) => {
      var result = program.formatter.format(items, {
        program: program,
        columns: {
          'ID': el => el.ROWID,
          'Date': el => el.XFORMATTEDDATESTRING,
          'Sender': el => el.sender,
          'Token': el => el.token,
          'Duration': el => el.duration,
          'Expiration': el => el.expiration,
          'Trashed': el => el.trashed_date,
          'Flags': el => el.flags
        }
      })

      resolve(result)
    })
    .catch(reject)
}
