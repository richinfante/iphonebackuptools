const log = require('../../../util/log')
const path = require('path')
const sqlite3 = require('sqlite3')
const bplist = require('bplist-parser')
const fs = require('fs')
const plist = require('plist')

// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const domain = 'AppDomainGroup-group.com.facebook.Messenger'

module.exports.name = 'facebook_messenger_friends'
module.exports.description = 'Show Facebook Messenger friends'

// Specify this only works for iOS 9+
module.exports.supportedVersions = '>=10.0'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

// You can also provide an array of functions instead of using `module.exports.func`.
// These functions *should* be independent ranges to ensure reliable execution
module.exports.functions = {

  '>=10.0': function (program, backup, resolve, reject) {
    // This function would be called for iOS 10+

    backup.getFileManifest()
      .then((items) => {
        let filename = 'fbomnistore.db'
        let fileitem = items.find((file) => {
          if (file && file.relativePath)
            return ~file.relativePath.indexOf(filename)
          return false
        })
        if (fileitem) {
          let filepath = fileitem.relativePath
          let file = fileHash(filepath, domain)
          return facebookMessengerFriendsReport(backup, file)
        } else return [] // Return an empty array to the formatter, since no fbomnistore.db file can be found in the manifest
      })
      .then((items) => {
        var result = program.formatter.format(items, {
          program: program,
          columns: { 
            'Facebook Friend Usernames': el => el.field_value
          }
        })

        resolve(result)
      })
      .catch((e) => {
        console.log('[!] Encountered an Error:', e)
      })
  },

  '>=5.0,<10.0': function (program, backup, resolve, reject) {
    // This function would be called for all iOS 5 up to iOS 9.x.
    // TODO
    /*backup.getOldFileManifest()
      .then((items) => {
        var result = program.formatter.format(items, {
          program: program,
          columns: { 
            'Facebook Friend Username': el => el.field_value
          }
        })

        resolve(result)
      })
      .catch(reject)*/
  }
}

const facebookMessengerFriendsReport = (backup, file) => {
  return new Promise((resolve, reject) => {
    var database = backup.getDatabase(file)
    try {
      database.get(`
      SELECT name 
      FROM sqlite_master 
      WHERE type='table' 
      AND name LIKE 'collection_index#messenger_contacts_ios%' 
      LIMIT 1
      `,
      (err, table_name) => {
        table_name = table_name.name
        console.log("Table", table_name)
        database.all(`
        SELECT field_value 
        FROM '${table_name}' 
        WHERE field_name='username'
        `, (err, rows) => {
          resolve(rows)
        })
      })

    } catch (e) {
      reject(e)
    }
  })
}