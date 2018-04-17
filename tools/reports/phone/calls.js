const fileHash = require('../../util/backup_filehash')
const log = require('../../util/log')

const CALLS_DB = '2b2b0084a1bc3a5ac8c27afdf14afb42c61a19ca'
const CALLS2_DB = fileHash('Library/CallHistoryDB/CallHistory.storedata')

module.exports = {
  version: 4,
  name: 'phone.calls',
  description: `List all call records contained in the backup.`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
  run (lib, { backup }) {
    return getCallsList(backup)
  },

  // Manifest fields.
  output: {
    id: el => el.Z_PK,
    date: el => el.XFORMATTEDDATESTRING,
    answered: el => !!el.ZANSWERED,
    originated: el => !!el.ZORIGINATED,
    callType: el => {
      if (el.ZCALLTYPE === 1) {
        return 'Cellular'
      } else if (el.ZCALLTYPE === 16) {
        return 'FacetimeAudio'
      } else if (el.ZCALLTYPE === 8) {
        return 'FacetimeVideo'
      }

      return 'Unknown'
    },
    duration: el => el.ZDURATION + '',
    location: el => {
      // console.log(el.ZLOCATION)
      if (el.ZLOCATION === '<<RecentsNumberLocationNotFound>>') {
        return null
      } 

      return el.ZLOCATION + ''
    },
    country: el => el.ZISO_COUNTRY_CODE + '',
    service: el => el.ZSERVICE_PROVIDER || null,
    address: el => (el.ZADDRESS || '').toString()
  }
}

function getCallsList (backup) {
  return new Promise(async (resolve, reject) => {
    try {
      var ios7log = await getCallsListiOS7(backup)
    } catch (e) {
      log.verbose('tried ios7 calls', e)
    }

    try {
      var newerIOS = await getCallsListLater(backup)
    } catch (e) {
      log.verbose('tried ios7+ calls', e)
    }

    // Check if they both are not found.
    if (ios7log == null && newerIOS == null) {
      return reject(new Error('no call logs found'))
    }

    // Resolve call logs.
    resolve([...(ios7log || []), ...(newerIOS || [])])
  })
}

// Try older databases.
function getCallsListiOS7 (backup) {
  return new Promise((resolve, reject) => {
    // Attempt to open database.
    backup.openDatabase(CALLS_DB)
      .then(db => {
        db.all(`
        SELECT 
          ROWID as Z_PK, 
          datetime(date, 'unixepoch') AS XFORMATTEDDATESTRING, 
          answered as ZANSWERED,
          duration as ZDURATION,
          address as ZADDRESS,
          country_code as ZISO_COUNTRY_CODE, 
          country_code as ZISO_COUNTRY_CODE, 
          *
        FROM call
        ORDER BY date ASC`,
        function (err, rows) {
          if (err) reject(err)

          resolve(rows)
        })
      })
      .catch(reject)
  })
}

// iOS 7+ moves to a new database.
// Try that.
function getCallsListLater (backup) {
  return new Promise((resolve, reject) => {
    backup.openDatabase(CALLS2_DB)
      .then(db => {
        db.all(`SELECT *, datetime(ZDATE + 978307200, 'unixepoch') AS XFORMATTEDDATESTRING from ZCALLRECORD ORDER BY ZDATE ASC`, async function (err, rows) {
          if (err) reject(err)

          resolve(rows)
        })
      })
      .catch(reject)
  })
}
