module.exports.name = 'voicemail'
module.exports.description = 'List all or extract voicemails on device'

// Specify this reporter requires a backup. 
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this only works for iOS 10+
module.exports.supportedVersions = '>=9.0'

module.exports.func = function (program, backup) {

  backup.getVoicemailsList()
    .then((items) => {

      program.formatter.format(items, {
        color: program.color,
        columns: {
          'ID': el => el.ROWID,
          'Date': el => el.XFORMATTEDDATESTRING,
          'Sender': el => el.sender,
          'Token': el => el.token,
          'Duration': el => el.duration,
          'Expiration': el => el.expiration,
          'Duration': el => el.duration,
          'Trashed': el => el.trashed_date,
          'Flags': el => el.flags
        }
      })
    })
    .catch((e) => {
      console.log('[!] Encountered an Error:', e)
    })
}
