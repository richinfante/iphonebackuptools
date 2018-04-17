const log = require('../../../util/log')
const path = require('path')
const sqlite3 = require('sqlite3')
const bplist = require('bplist-parser')
const fs = require('fs')
const plist = require('plist')


// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const file = fileHash('Library/Preferences/com.burbn.instagram.plist', 'AppDomain-com.burbn.instagram')

module.exports.name = 'instagram_profile'
module.exports.description = 'Show Instagram profile/user data'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = function (program, backup, resolve, reject) {
  instagramProfileReport(backup)
    .then((items) => {
      var result = program.formatter.format(items, {
        program: program,
        columns: { 
          'Key': el => el.key,
          'Value': el => el.value
        }
      })

      resolve(result)
    })
    .catch(reject)
}

function KeyValue (property, plist) {
  this.key = property
  this.value = plist[property] ? plist[property] : 'N/A'
}

const instagramProfileReport = (backup) => {
  return new Promise((resolve, reject) => {
    var results = []
    var filename = backup.getFileName(file)
    try {
      let instagramPlist = bplist.parseBuffer(fs.readFileSync(filename))[0]
      
      results.push(new KeyValue('last-logged-in-username', instagramPlist))
      results.push(new KeyValue('prefill_fb_email', instagramPlist))
      results.push(new KeyValue('prefill_fb_phone', instagramPlist))

      resolve(results)
    } catch (e) {
      reject(e)
    }
  })
}