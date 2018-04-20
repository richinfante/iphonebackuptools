// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const domain = 'AppDomain-com.skype.skype'

module.exports.name = 'skype_accounts'
module.exports.description = 'Show Skype accounts'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = function (program, backup, resolve, reject) {
  backup.getFileManifest()
    .then((items) => {
      let filename = 'main.db'
      let fileitem = items.find((file) => {
        if (file && file.relativePath) {
          return ~file.relativePath.indexOf(filename) && file.domain === domain
        }
        return false
      })
      if (fileitem) {
        let filepath = fileitem.relativePath
        let file = fileHash(filepath, domain)
        return skypeAccountsReport(backup, file)
      } else return [] // Return an empty array to the formatter, since no main.db file can be found in the manifest
    })
    .then((items) => {
      var result = program.formatter.format(items, {
        program: program,
        columns: {
          'Skype Name': el => el.skypename
        }
      })

      resolve(result)
    })
    .catch((e) => {
      console.log('[!] Encountered an Error:', e)
    })
}

const skypeAccountsReport = (backup, file) => {
  return new Promise((resolve, reject) => {
    var database = backup.getDatabase(file)
    try {
      database.all(`
      SELECT * 
      FROM Accounts 
      `,
      (err, rows) => {
        if (err) resolve(err)
        resolve(rows)
      })
    } catch (e) {
      reject(e)
    }
  })
}
