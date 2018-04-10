const log = require('../util/log')
const path = require('path')
const sqlite3 = require('sqlite3')
const bplist = require('bplist-parser')
const fs = require('fs')
const plist = require('plist')

// Derive filenames based on domain + file path
const fileHash = require('../util/backup_filehash')

const database = fileHash('Library/Safari/BrowserState.db', 'AppDomain-com.apple.mobilesafari')

module.exports.name = 'safari_open_tabs'
module.exports.description = 'List open Safari tabs when backup was made'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

// Specify this only works for iOS 10+
// If it is iOS-version specific, you can specify version information here.
// You may provide a comma separated string such as ">=6.0,<11.0" to indicate ranges.
module.exports.supportedVersions = '>=10.0'

module.exports.func = function (program, backup, resolve, reject) {
  openTabsReport(backup)
    .then((items) => {
      var result = program.formatter.format(items, {
        program: program,
        columns: {
          'Title': el => el.title,
          'URL': el => el.url,
          'Last Viewed Time': el => (new Date((el.last_viewed_time + 978307200) * 1000).toDateString()) + ' ' + (new Date((el.last_viewed_time + 978307200) * 1000).toTimeString())
        }
      })
      resolve(result)
    })
    .catch(reject)
}

const openTabsReport = (backup) => {
  return new Promise((resolve, reject) => {
    var browserStatedb = backup.getDatabase(database)
      try {
        const query = `
        select * from tabs
        order by last_viewed_time DESC
        `
        browserStatedb.all(query, async function (err, rows) {
          if (err) reject(err)

          resolve(rows)
        })
      } catch (e) {
        reject(e)
      }
  })
}