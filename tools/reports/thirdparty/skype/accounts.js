// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const domain = 'AppDomain-com.skype.skype'

module.exports = {
  version: 4,
  name: 'skype.accounts',
  description: `Show Skype accounts`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
    run (lib, { backup }) {
        return skypeAccountsReport(backup)
    },

  // Fields for apps report
  output: {
          'Skype Name': el => el.skypename
  }
}


const skypeAccountsReport = (backup) => { 
    return new Promise((resolve, reject) => {
        backup.getManifest()
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
                    
                    backup.openDatabase(file).then(database => {
                        database.all(`SELECT * FROM Accounts `, (err, rows) => {
                            if (err) resolve(err)
                            resolve(rows);
                        })
                    }).catch(reject)
                } else reject("Cannot find main.db"); // Return an empty array to the formatter, since no main.db file can be found in the manifest
            });
    })
}
