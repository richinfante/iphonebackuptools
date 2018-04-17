const log = require('../util/log')
const path = require('path')
const sqlite3 = require('sqlite3')
const bplist = require('bplist-parser')
const fs = require('fs')
const plist = require('plist')


// Derive filenames based on domain + file path
const fileHash = require('../util/backup_filehash')

const file = fileHash('Library/Preferences/group.com.burbn.instagram.plist', 'AppDomainGroup-group.com.burbn.instagram')

module.exports.name = 'instagram_following_users_coded'
module.exports.description = 'Show Instagram following users coded data'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = function (program, backup, resolve, reject) {
  instagramRecentSearchesReport(backup)
    .then((items) => {
      var result = program.formatter.format(items, {
        program: program,
        columns: { 
          'Identifier': el => el
        }
      })

      resolve(result)
    })
    .catch(reject)
}

const instagramRecentSearchesReport = (backup) => {
  return new Promise((resolve, reject) => {
    var results = []
    var filename = backup.getFileName(file)
    try {
      let instagramPlist = bplist.parseBuffer(fs.readFileSync(filename))[0]
      let followingUsersKey = Object.keys(instagramPlist).filter(key => key.indexOf('-following-users.coded') !== -1)
      followingUsersKey.forEach(key => {
        let followingUsers = instagramPlist[key]
        results.push(...followingUsers)
      })

      resolve(results)
    } catch (e) {
      reject(e)
    }
  })
}