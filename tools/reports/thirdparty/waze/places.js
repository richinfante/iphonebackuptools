const log = require('../../../util/log')
const path = require('path')
const sqlite3 = require('sqlite3')
const bplist = require('bplist-parser')
const fs = require('fs')
const plist = require('plist')

// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const database = fileHash('Documents/user.db', 'AppDomain-com.waze.iphone')

module.exports.name = 'waze_places'
module.exports.description = 'List Waze app places'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = function (program, backup, resolve, reject) {
  wazeReport(backup)
    .then((items) => {
      var result = program.formatter.format(items, {
        program: program,
        columns: {
          'Name': el => el.name,
          'Created Date': el => (new Date((el.created_time) * 1000).toDateString()) + ' ' + (new Date((el.created_time) * 1000).toTimeString()) ,
          'Latitude': el => el.latitude / 1000000,
          'Longitude': el => el.longitude / 1000000,
          'Street': el => el.street,
          'City': el => el.city,
          'State': el => el.state,
          'Country': el => el.country
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

const wazeReport = (backup) => {
  return new Promise((resolve, reject) => {
    var wazedb = backup.getDatabase(database)
      try {
        const query = `
        select * from PLACES
        order by id
        `
        wazedb.all(query, async function (err, rows) {
          if (err) reject(err)

          resolve(rows)
        })
      } catch (e) {
        reject(e)
      }
  })
}