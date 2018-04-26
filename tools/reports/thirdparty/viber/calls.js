// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const database = fileHash('com.viber/database/Contacts.data', 'AppDomainGroup-group.viber.share.container')

module.exports.name = 'viber_calls'
module.exports.description = 'List Viber calls'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = function (program, backup, resolve, reject) {
  viberCallsReport(backup)
    .then((items) => {
      var result = program.formatter.format(items, {
        program: program,
        columns: {
          'PK': el => el.Z_PK,
          'Date': el => (new Date((el.ZDATE + 978307200) * 1000).toDateString()) + ' ' + (new Date((el.ZDATE + 978307200) * 1000).toTimeString()),
          'Name': el => el.ZMAINNAME + ' ' + el.ZSUFFIXNAME,
          'Phone': el => el.ZPHONENUMBER,
          'Call Type': el => el.ZCALLTYPE
        }
      })
      resolve(result)
    })
    .catch(reject)
}

const viberCallsReport = (backup) => {
  return new Promise((resolve, reject) => {
    var vibercallsdb = backup.getDatabase(database)
    try {
      const query = `
        SELECT * FROM ZRECENTSLINE
        INNER JOIN ZABCONTACT
        ON ZABCONTACT.Z_PK = ZRECENTSLINE.ZCONTACT
        ORDER BY ZABCONTACT.Z_PK;
        `
      vibercallsdb.all(query, async function (err, rows) {
        if (err) reject(err)

        resolve(rows)
      })
    } catch (e) {
      reject(e)
    }
  })
}
