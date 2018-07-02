// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')
const apple_timestamp = require('../../../util/apple_timestamp')

const database = fileHash('com.viber/database/Contacts.data', 'AppDomainGroup-group.viber.share.container')

module.exports = {
  version: 4,
  name: 'viber_calls',
  description: `List Viber calls`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
    run (lib, { backup }) {
        return viberCallsReport(backup)
    },

  // Fields for apps report
  output: {
          'PK': el => el.Z_PK,
          'Date': el => el.ZDATE_STRING,
          'Name': el => el.ZMAINNAME + ' ' + el.ZSUFFIXNAME,
          'Phone': el => el.ZPHONENUMBER,
          'Call Type': el => el.ZCALLTYPE
  }
}


const viberCallsReport = (backup) => {
    return new Promise((resolve, reject) => {
        backup.openDatabase(database).then(database => {
            const query = `
        SELECT *, ${apple_timestamp.parse('ZRECENTSLINE.ZDATE')} AS ZDATE_STRING FROM ZRECENTSLINE
        INNER JOIN ZABCONTACT
        ON ZABCONTACT.Z_PK = ZRECENTSLINE.ZCONTACT
        ORDER BY ZABCONTACT.Z_PK;
        `            
            database.all(query, (err, rows) => {
                if (err) resolve(err)
                resolve(rows);
            })
        }).catch(reject)
        
    })
}
