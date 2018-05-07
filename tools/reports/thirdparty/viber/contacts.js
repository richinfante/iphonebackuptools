// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const database = fileHash('com.viber/database/Contacts.data', 'AppDomainGroup-group.viber.share.container')

module.exports.name = 'viber_contacts'
module.exports.description = 'List Viber contacts'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = function (program, backup, resolve, reject) {
  viberContactsReport(backup)
    .then((items) => {
      var result = program.formatter.format(items, {
        program: program,
        columns: {
          'PK': el => el.Z_PK,
          'Name': el => el.ZDISPLAYFULLNAME,
          'Phone': el => el.ZPHONE
        }
      })
      resolve(result)
    })
    .catch(reject)
}

const viberContactsReport = (backup) => {
  return new Promise((resolve, reject) => {
    var vibercontactsdb = backup.getDatabase(database)
    try {
      const query = `
        SELECT * FROM ZMEMBER
        INNER JOIN ZPHONENUMBER
        ON ZPHONENUMBER.ZMEMBER = ZMEMBER.Z_PK
        ORDER BY ZMEMBER.Z_PK;
        `
      vibercontactsdb.all(query, async function (err, rows) {
        if (err) reject(err)

        resolve(rows)
      })
    } catch (e) {
      reject(e)
    }
  })
}
