const log = require('../util/log')
const path = require('path')
const sqlite3 = require('sqlite3')
const bplist = require('bplist-parser')
const fs = require('fs')
const plist = require('plist')


// Derive filenames based on domain + file path
const fileHash = require('../util/backup_filehash')

const file = fileHash('Library/Preferences/com.apple.mobilesafari.plist', 'AppDomain-com.apple.mobilesafari')

module.exports.name = 'safari_recent_searches'
module.exports.description = 'Show Safari recent searches'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = function (program, backup, resolve, reject) {
  safariRecentSearches(backup)
    .then((items) => {
      var result = program.formatter.format(items, {
        program: program,
        columns: { 
          'SearchString': el => el.SearchString,
          'Date': el => el.Date
        }
      })

      resolve(result)
    })
    .catch(reject)
}

const safariRecentSearches = (backup) => {
  return new Promise((resolve, reject) => {
    var filename = backup.getFileName(file)
    try {
      let mobilesafariPlist = bplist.parseBuffer(fs.readFileSync(filename))[0]
      
      resolve(mobilesafariPlist['RecentWebSearches'])
    } catch (e) {
      reject(e)
    }
  })
}