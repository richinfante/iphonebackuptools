// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const database = fileHash('com.viber/database/Contacts.data', 'AppDomainGroup-group.viber.share.container')

module.exports.name = 'viber_messages'
module.exports.description = 'List Viber messages'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = function (program, backup, resolve, reject) {
  viberMessagesReport(backup)
    .then((items) => {
      var result = program.formatter.format(items, {
        program: program,
        columns: {
          'PK': el => el.Z_PK,
          'Date': el => (new Date((el.ZDATE + 978307200) * 1000).toDateString()) + ' ' + (new Date((el.ZDATE + 978307200) * 1000).toTimeString()),
          'Name': el => el.ZDISPLAYFULLNAME,
          'Text': el => el.ZTEXT,
          'State': el => el.ZSTATE
        }
      })
      resolve(result)
    })
    .catch(reject)
}

const viberMessagesReport = (backup) => {
  return new Promise((resolve, reject) => {
    var vibermessagesdb = backup.getDatabase(database)
    try {
      const query = `
        SELECT * FROM ZVIBERMESSAGE
        INNER JOIN ZCONVERSATION
        ON ZCONVERSATION.Z_PK = ZVIBERMESSAGE.ZCONVERSATION
        INNER JOIN ZMEMBER
        ON ZCONVERSATION.ZINTERLOCUTOR = ZMEMBER.Z_PK
        ORDER BY ZVIBERMESSAGE.Z_PK DESC;
        `
      vibermessagesdb.all(query, async function (err, rows) {
        if (err) reject(err)

        resolve(rows)
      })
    } catch (e) {
      reject(e)
    }
  })
}
