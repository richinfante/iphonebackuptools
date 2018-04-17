const log = require('../../../util/log')
const path = require('path')
const sqlite3 = require('sqlite3')
const bplist = require('bplist-parser')
const fs = require('fs')
const plist = require('plist')


// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const file = fileHash('Library/Preferences/com.facebook.Messenger.plist', 'AppDomain-com.facebook.Messenger')

module.exports.name = 'facebook_profile'
module.exports.description = 'Show Facebook Messenger user id'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = function (program, backup, resolve, reject) {
  facebookProfileReport(backup)
    .then((items) => {
      var result = program.formatter.format(items, {
        program: program,
        columns: { 
          'Facebook User ID': el => el.fbid
        }
      })

      resolve(result)
    })
    .catch(reject)
}

const facebookProfileReport = (backup) => {
  return new Promise((resolve, reject) => {
    var filename = backup.getFileName(file)
    try {
      let facebookPlist = bplist.parseBuffer(fs.readFileSync(filename))[0]
      let facebookUserIds = Object.keys(facebookPlist['kUserGlobalSettings'])
      facebookUserIds = facebookUserIds.map((fbid) => ({
        fbid: fbid
      }))

      resolve(facebookUserIds)
    } catch (e) {
      reject(e)
    }
  })
}