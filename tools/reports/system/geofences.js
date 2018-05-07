const fileHash = require('../../util/backup_filehash')

const GEO_DB = fileHash('Library/Caches/locationd/consolidated.db', 'RootDomain')

module.exports = {
  version: 4,
  name: 'system.geofences',
  description: `List local geofences used for triggers`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
  run (lib, { backup }) {
    return getGeoFences(backup)
  },

  // Wifi Report Fields.
  output: {
    date: el => el.XFORMATTEDDATESTRING,
    latitude: el => el.Latitude,
    longitude: el => el.Longitude,
    distance: el => el.Distance
  }
}

function getGeoFences (backup) {
  return new Promise((resolve, reject) => {
    backup.openDatabase(GEO_DB)
      .then(db => {
        db.all(`SELECT datetime(Timestamp + 978307200, 'unixepoch') AS XFORMATTEDDATESTRING, Latitude, Longitude, Distance FROM Fences ORDER BY Timestamp ASC`, async function (err, rows) {
          if (err) reject(err)

          resolve(rows)
        })
      })
      .catch(reject)
  })
}
