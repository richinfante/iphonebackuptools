const log = require('../../../util/log')
const path = require('path')
const sqlite3 = require('sqlite3')
const fs = require('fs')

// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const database = fileHash('Documents/user.db', 'AppDomain-com.waze.iphone')

module.exports = {
  version: 4,
  name: 'waze_recents',
  description: `List Waze app recent destinations`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
    run (lib, { backup }) {
        return wazeReport(backup)
    },

  // Fields for apps report
  output: {
          'Id': el => el.id,
          'Name': el => el.name,
          'Created Date': el => (new Date((el.created_time) * 1000).toDateString()) + ' ' + (new Date((el.created_time) * 1000).toTimeString()) ,
          'Access Date': el => (new Date((el.access_time) * 1000).toDateString()) + ' ' + (new Date((el.access_time) * 1000).toTimeString()) ,
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
      backup.openDatabase(database).then(database => {
          const query = `
        select RECENTS.name, RECENTS.created_time, RECENTS.access_time, RECENTS.id, PLACES.latitude, PLACES.longitude, PLACES.street, PLACES.city, PLACES.state, PLACES.country from RECENTS
        left join PLACES on RECENTS.place_id = PLACES.id
        order by RECENTS.id
        `
          database.all(query, async function (err, rows) {
              if (err) reject(err)
              
              resolve(rows)
          })
      }).catch(reject)
  })
}
