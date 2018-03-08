const log = require('../util/log')
const path = require('path')
const sqlite3 = require('sqlite3')
const bplist = require('bplist-parser')
const fs = require('fs')
const plist = require('plist')

// Derive filenames based on domain + file path
const fileHash = require('../util/backup_filehash')

const database = fileHash('Library/Calendar/Calendar.sqlitedb')

module.exports.name = 'calendar'
module.exports.description = 'List calendar entries'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = function (program, backup, resolve, reject) {
  calendarReport(backup)
    .then((items) => {
      var result = program.formatter.format(items, {
        program: program,
        columns: {
          'Timestamp': el => (new Date((el.start_date + 978307200) * 1000).toDateString()) + ' ' + (new Date((el.start_date + 978307200) * 1000).toTimeString()) ,
          'Title': el => el.summary,
          'Content': el => el.description
        }
      })
      resolve(result)
    })
    .catch(reject)
}

const calendarReport = (backup) => {
  return new Promise((resolve, reject) => {
    var calendardb = backup.getDatabase(database)
      try {
        const query = `
        select * from CalendarItem
        order by start_date
        `
        calendardb.all(query, async function (err, rows) {
          if (err) reject(err)

          resolve(rows)
        })
      } catch (e) {
        reject(e)
      }
  })
}