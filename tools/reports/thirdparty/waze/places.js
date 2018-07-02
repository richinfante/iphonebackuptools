const log = require('../../../util/log')
const path = require('path')
const sqlite3 = require('sqlite3')
const bplist = require('bplist-parser')
const fs = require('fs')
const plist = require('plist')


// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const database = fileHash('Documents/user.db', 'AppDomain-com.waze.iphone')


module.exports = {
  version: 4,
  name: 'waze_places',
  description: `List Waze app places`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
    run (lib, { backup }) {
        return wazeReport(backup)
    },

  // Fields for apps report
  output: {
          'Name': el => el.name,
          'Created Date': el => (new Date((el.created_time) * 1000).toDateString()) + ' ' + (new Date((el.created_time) * 1000).toTimeString()) ,
          'Latitude': el => el.latitude / 1000000,
          'Longitude': el => el.longitude / 1000000,
          'Street': el => el.street,
          'City': el => el.city,
          'State': el => el.state,
          'Country': el => el.country
  }
}



function KeyValue (property, plist) {
  this.key = property
  this.value = plist[property] ? plist[property] : 'N/A'
}

const wazeReport = (backup) => {
  return new Promise((resolve, reject) => {
    backup.openDatabase(database)
    .then(db => {
        const query = `
        select * from PLACES
        order by id
        `
        db.all(query, async function (err, rows) {
          if (err) reject(err)

          resolve(rows)
        })
    }).catch(reject)
  })
}
