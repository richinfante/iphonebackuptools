const log = require('../../../util/log')

// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const domain = 'AppDomainGroup-group.com.facebook.Messenger'



module.exports = {
  version: 4,
  name: 'facebook_messenger_friends',
  description: `Show Facebook Messenger friends`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
    run (lib, { backup }) {
        return facebookMessengerFriendsReport(backup)
    },

  // Fields for apps report
  output: {
      'Facebook Friend Username': el => el.field_value
  }
}


const facebookMessengerFriendsReport = (backup, file) => {
  return new Promise((resolve, reject) => {
    backup.getManifest()
      .then((items) => {
        let filename = 'fbomnistore.db'
        let fileitem = items.find((file) => {
          if (file && file.relativePath) { return ~file.relativePath.indexOf(filename) }
          return false
        })
        if (fileitem) {
          let filepath = fileitem.relativePath
          let file = fileHash(filepath, domain)
          backup.openDatabase(file).then(database => {
              database.get(`
                      SELECT name 
                      FROM sqlite_master 
                      WHERE type='table' 
                      AND name LIKE 'collection_index#messenger_contacts_ios%' 
                      LIMIT 1
                      `,
                     (err, tableName) => {
                         if (err) return reject(err)
                         tableName = tableName.name
                         log.verbose('Table', tableName)
                         database.all(`
                            SELECT field_value 
                            FROM '${tableName}' 
                            WHERE field_name='username'
                            `, (err, rows) => {
                                if (err) return reject(err)
                                resolve(rows)
                            })
                     })
          }).catch(reject)
        } else reject("Cannot find fbomnistore.db") // Return an empty array to the formatter, since no fbomnistore.db file can be found in the manifest
      })
  })
}
