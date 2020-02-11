// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')
const apple_timestamp = require('../../../util/apple_timestamp')

const database = fileHash('com.viber/database/Contacts.data', 'AppDomainGroup-group.viber.share.container')


module.exports = {
  version: 4,
  name: 'viber_messages',
  description: `List Viber messages`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
    run (lib, { backup }) {
        return viberMessagesReport(backup)
    },

  // Fields for apps report
  output: {
          'PK': el => el.Z_PK,
          'Date': el => el.ZDATE_STRING,
          'Name': el => el.ZDISPLAYFULLNAME,
          'Text': el => el.ZTEXT,
          'State': el => el.ZSTATE
  }
}

const viberMessagesReport = (backup) => {
    return new Promise((resolve, reject) => {
        console.log(database)
     backup.openDatabase(database).then(database => {
            const query = `
        SELECT *, ${apple_timestamp.parse('ZVIBERMESSAGE.ZDATE')} AS ZDATE_STRING FROM ZVIBERMESSAGE
        INNER JOIN ZCONVERSATION
        ON ZCONVERSATION.Z_PK = ZVIBERMESSAGE.ZCONVERSATION
        INNER JOIN ZMEMBER
        ON ZCONVERSATION.ZINTERLOCUTOR = ZMEMBER.Z_PK
        ORDER BY ZVIBERMESSAGE.Z_PK DESC;
        `
      database.all(query, async function (err, rows) {
        if (err) reject(err)
        resolve(rows)
      })
     }).catch(reject)
  })
}
