const log = require('../util/log')
const path = require('path')
const sqlite3 = require('sqlite3')
const bplist = require('bplist-parser')
const fs = require('fs')
const plist = require('plist')

// Derive filenames based on domain + file path
const fileHash = require('../util/backup_filehash')

const domain = 'AppDomain-com.skype.skype'

module.exports.name = 'skype_calls'
module.exports.description = 'Show Skype calls'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = function (program, backup, resolve, reject) {
  backup.getFileManifest()
    .then((items) => {
      let filename = 'main.db'
      let fileitem = items.find((file) => {
        if (file && file.relativePath)
          return ~file.relativePath.indexOf(filename) && file.domain == domain
        return false
      })
      if (fileitem) {
        let filepath = fileitem.relativePath
        let file = fileHash(filepath, domain)
        return skypeAccountsReport(backup, file)
      } else return [] // Return an empty array to the formatter, since no main.db file can be found in the manifest
    })
    .then((items) => {
      var result = program.formatter.format(items, {
        program: program,
        columns: { 
          'Begin Timestamp': el => (new Date((el.begin_timestamp) * 1000).toDateString()) + ' ' + (new Date((el.begin_timestamp) * 1000).toTimeString()),
          'Host Identity': el => el.host_identity,
          'Duration': el => el.duration ? el.duration : 'N/A',
          'Is Incoming': el => el.is_incoming === 1 ? 'Yes' : 'No',
          'Caller': el => el.caller_mri_identity
        }
      })

      resolve(result)
    })
    .catch((e) => {
      console.log('[!] Encountered an Error:', e)
    })
}

const skypeAccountsReport = (backup, file) => {
  return new Promise((resolve, reject) => {
    var database = backup.getDatabase(file)
    try {
      database.all(`
      SELECT * 
      FROM Calls 
      `,
      (err, rows) => {
        resolve(rows)
      })

    } catch (e) {
      reject(e)
    }
  })
}