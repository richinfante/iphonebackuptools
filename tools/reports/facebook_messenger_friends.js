const log = require('../util/log')
const path = require('path')
const sqlite3 = require('sqlite3')
const bplist = require('bplist-parser')
const fs = require('fs')
const plist = require('plist')


// Derive filenames based on domain + file path
const fileHash = require('../util/backup_filehash')

const domain = 'AppDomainGroup-group.com.facebook.Messenger'
//const file = fileHash('Library/Preferences/com.facebook.Messenger.plist', 'AppDomain-com.facebook.Messenger')

module.exports.name = 'facebook_messenger_friends'
module.exports.description = 'Show Facebook Messenger friends'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true
/*
module.exports.func = function (program, backup, resolve, reject) {
  facebookMessengerFriendsReport(backup)
    .then((items) => {
      var result = program.formatter.format(items, {
        program: program,
        columns: { 
          'Facebook User ID': el => ''
        }
      })

      resolve(result)
    })
    .catch(reject)
}*/

const facebookMessengerFriendsReport = (backup, file) => {
  return new Promise((resolve, reject) => {
    var database = backup.getDatabase(file)
    try {

      console.log(file)
      let friends = []

      resolve(friends)
    } catch (e) {
      reject(e)
    }
  })
}

// You can also provide an array of functions instead of using `module.exports.func`.
// These functions *should* be independent ranges to ensure reliable execution
module.exports.functions = {

  '>=10.0': function (program, backup, resolve, reject) {
    // This function would be called for iOS 10+

    backup.getFileManifest()
      .then((items) => {
        let filename = 'fbomnistore.db'
        let fileitem = items.find((file) => {
          return ~file.relativePath.indexOf(filename)
        })
        let filepath = fileitem.relativePath
        let file = fileHash(filepath, domain)
        return facebookMessengerFriendsReport(backup, file)
      })
      .then((items) => {
        var result = program.formatter.format(items, {
          program: program,
          columns: { 
            'Facebook User ID': el => ''
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
    backup.getOldFileManifest()
      .then((items) => {
        var result = program.formatter.format(items, {
          program: program,
          columns: {
            'ID': el => el.fileID,
            'Domain/Path': el => (el.domain + ': ' + el.filename).substr(0, 70),
            'Size': el => el.filelen
          }
        })

        resolve(result)
      })
      .catch(reject)
  }
}
