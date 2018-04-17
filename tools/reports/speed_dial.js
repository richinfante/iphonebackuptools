const log = require('../util/log')
const path = require('path')
const sqlite3 = require('sqlite3')
const bplist = require('bplist-parser')
const fs = require('fs')
const plist = require('plist')


// Derive filenames based on domain + file path
const fileHash = require('../util/backup_filehash')

const file = fileHash('Library/Preferences/com.apple.mobilephone.speeddial.plist')

module.exports.name = 'speed_dial'
module.exports.description = 'Show Speed dial contact information'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = function (program, backup, resolve, reject) {
  speedDialReport(backup)
    .then((items) => {
      var result = program.formatter.format(items, {
        program: program,
        columns: { 
          'Action Type': el => el.ActionType ? el.ActionType.indexOf('ActionType') !== -1 ? el.ActionType.split('ActionType')[0] : el.ActionType : 'N/A',
          'Contact Name': el => el.Name,
          'Value': el => el.Value
        }
      })

      resolve(result)
    })
    .catch(reject)
}

const speedDialReport = (backup) => {
  return new Promise((resolve, reject) => {
    var filename = backup.getFileName(file)
    try {
      let speeddialPlist = bplist.parseBuffer(fs.readFileSync(filename))[0]
      
      resolve(speeddialPlist)
    } catch (e) {
      reject(e)
    }
  })
}