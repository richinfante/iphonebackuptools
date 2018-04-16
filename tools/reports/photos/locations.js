const fileHash = require('../../util/backup_filehash')

const PHOTOS_DB = fileHash('Media/PhotoData/Photos.sqlite', 'CameraRollDomain')

module.exports = {
  version: 3,
  name: 'photos.locations',
  description: `List all photo geotag's GPS locations`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
  run (lib, { backup }) {
    return getPhotoLocationHistory(backup)
  },

  // Manifest fields.
  output: {
    time: el => el.XFORMATTEDDATESTRING,
    latitude: el => el.ZLATITUDE,
    longitude: el => el.ZLONGITUDE,
    file: el => el.ZFILENAME
  }
}

function getPhotoLocationHistory (backup) {
  return new Promise((resolve, reject) => {
    backup.openDatabase(PHOTOS_DB)
      .then(db => {
        db.all(`SELECT 
          ZDATECREATED, 
          ZLATITUDE, 
          ZLONGITUDE,
          ZFILENAME,
          datetime(ZDATECREATED + 978307200, 'unixepoch') AS XFORMATTEDDATESTRING 
          FROM ZGENERICASSET ORDER BY ZDATECREATED ASC`, function (err, rows) {
          if (err) reject(err)

          resolve(rows)
        })
      })
      .catch(reject)
  })
}
