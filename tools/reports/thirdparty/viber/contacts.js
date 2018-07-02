// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const database = fileHash('com.viber/database/Contacts.data', 'AppDomainGroup-group.viber.share.container')

module.exports = {
  version: 4,
  name: 'viber_contacts',
  description: `List Viber contacts`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
    run (lib, { backup }) {
        return viberContactsReport(backup)
    },

  // Fields for apps report
  output: {
          'PK': el => el.Z_PK,
          'Name': el => el.ZDISPLAYFULLNAME,
          'Phone': el => el.ZPHONE
  }
}


const viberContactsReport = (backup) => {
  return new Promise((resolve, reject) => {
      backup.openDatabase(database).then(database => {
            const query = `
        SELECT * FROM ZMEMBER
        INNER JOIN ZPHONENUMBER
        ON ZPHONENUMBER.ZMEMBER = ZMEMBER.Z_PK
        ORDER BY ZMEMBER.Z_PK;
        `
          database.all(query, async function (err, rows) {
              if (err) reject(err)
              resolve(rows)
          })
      }).catch(reject)
  })
}
