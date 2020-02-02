const log = require('../../../util/log')
const path = require('path')
const sqlite3 = require('sqlite3')
const fs = require('fs')

// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const database = fileHash('Documents/user.db', 'AppDomain-com.waze.iphone')

module.exports = {
  version: 4,
  name: 'waze_favorites',
  description: `List Waze app favorite places`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
    run (lib, { backup }) {
        return wazeReport(backup)
    },

  // Fields for apps report
  output: {
          'Name': el => el.name,
          'Modified Date': el => (new Date((el.modified_time) * 1000).toDateString()) + ' ' + (new Date((el.modified_time) * 1000).toTimeString()) ,
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
        const query = `
        select FAVORITES.name, FAVORITES.created_time, FAVORITES.modified_time, FAVORITES.rank, PLACES.latitude, PLACES.longitude, PLACES.street, PLACES.city, PLACES.state, PLACES.country from FAVORITES
        left join PLACES on FAVORITES.place_id = PLACES.id
        order by rank  `
        
        backup.openDatabase(database).then(database => {
            database.all(query, (err, rows) => {
                if (err) resolve(err)
                resolve(rows);
            })
        }).catch(reject)
    })
}
