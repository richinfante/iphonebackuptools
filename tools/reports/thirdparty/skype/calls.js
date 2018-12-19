// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const domain = 'AppDomain-com.skype.skype'


module.exports = {
  version: 4,
  name: 'skype_calls',
  description: `Show Skype calls`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
    run (lib, { backup }) {
        return skypeAccountsReport(backup)
    },

  // Fields for apps report
  output: {
          'Begin Timestamp': el => (new Date((el.begin_timestamp) * 1000).toDateString()) + ' ' + (new Date((el.begin_timestamp) * 1000).toTimeString()),
          'Host Identity': el => el.host_identity,
          'Duration': el => el.duration ? el.duration : 'N/A',
          'Is Incoming': el => el.is_incoming === 1 ? 'Yes' : 'No',
          'Caller': el => el.caller_mri_identity
  }
}


const skypeAccountsReport = (backup, file) => {
  return new Promise((resolve, reject) => {
      backup.getManifest()
          .then((items) => {
              let filename = 'main.db'
              let fileitem = items.find((file) => {
                  if (file && file.filename) {
                      return ~file.filename.indexOf(filename) && file.domain === domain
                  }
                  return false
              })
              if (fileitem) {
                  let filepath = fileitem.filename
                  let file = fileHash(filepath, domain)
                  backup.openDatabase(file).then(database => {
                  database.all(` SELECT * FROM Calls `,
                               (err, rows) => {
                                   if (err) return reject(err)
                                   resolve(rows)
                               })
                  }).catch(reject)
              } else reject("Cannot find main.db") // Return an empty array to the formatter, since no main.db file can be found in the manifest
    })
  })
}
