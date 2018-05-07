const fileHash = require('../../util/backup_filehash')
const log = require('../../util/log')

const CALLS_DB = '2b2b0084a1bc3a5ac8c27afdf14afb42c61a19ca'
const CALLS2_DB = fileHash('Library/CallHistoryDB/CallHistory.storedata')

module.exports = {
  version: 4,
  name: 'phone.calls_statistics',
  description: `Get statistics about all calls`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
  run (lib, { backup }) {
    return getCallsStatistics(backup)
  },

  // Manifest fields.
  // We need to find a value, so OR both of the data sources.
  output: {
    timerAll: el => el.timer_all || el.ZTIMER_ALL || 0,
    timerIncoming: el => el.timer_incoming || el.ZTIMER_INCOMING || 0,
    timerLast: el => el.timer_last || el.ZTIMER_LAST || 0,
    timerOutgoing: el => el.timer_outgoing || el.ZTIMER_OUTGOING || 0,
    timerLifetime: el => el.timer_lifetime || el.ZTIMER_LIFETIME || 0
  }
}

function getCallsStatistics (backup) {
  return new Promise(async (resolve, reject) => {
    try {
      var ios7stats = await getCallsStatisticsiOS7(backup)
    } catch (e) {
      log.verbose('tried ios7 stats', e)
    }

    try {
      var newerIOS = await getCallsStatisticsLater(backup)
    } catch (e) {
      log.verbose('tried ios7+ stats', e)
    }

    // Check if they both are not found.
    if (ios7stats == null && newerIOS == null) {
      return reject(new Error('no call stats found'))
    }

    // Resolve call logs.
    resolve({...(ios7stats || {}), ...(newerIOS || {})})
  })
}

function getCallsStatisticsiOS7 (backup) {
  /*
    This resolves to a data object, similar to this:

    {
      call_history_limit: 100,
      timer_last: 0,
      timer_outgoing: 0,
      timer_incoming: 0,
      timer_all: 0,
      timer_lifetime: 0,
      timer_last_reset: 0,
      kCallDBHasMigratedToCoreDataProperty: 0,
      _ClientVersion: 13,
      _UniqueIdentifier: '<uuid>'
    }
  */
  return new Promise((resolve, reject) => {
    backup.openDatabase(CALLS_DB)
      .then(db => {
        db.all(`SELECT * from _SqliteDatabaseProperties`, function (err, rows) {
          if (err) reject(err)

          var result = {}
          rows = rows || []

          for (var item of rows) {
            // Try to convert numbers to strings.
            if (/^[+-]?\d+$/.test(item.value)) {
              // Matches int regex
              result[item.key] = parseInt(item.value)
            } else if (/^[+-]?\d+\.\d+$/.test(item.value)) {
              // Matches float regex
              result[item.key] = parseFloat(item.value)
            } else {
              // Use existing value
              result[item.key] = item.value
            }
          }

          resolve(result)
        })
      })
      .catch(reject)
  })
}

function getCallsStatisticsLater (backup) {
  /*
  This resolves to a data object, similar to:

  {
    Z_PK: 1,
    Z_ENT: 1,
    Z_OPT: 14,
    ZTIMER_ALL: 0,
    ZTIMER_INCOMING: 2135,
    ZTIMER_LAST: 0,
    ZTIMER_LIFETIME: 6590,
    ZTIMER_OUTGOING: 4455
  }
  */
  return new Promise((resolve, reject) => {
    backup.openDatabase(CALLS2_DB)
      .then(db => {
        db.all(`SELECT * from ZCALLDBPROPERTIES`, function (err, rows) {
          if (err) reject(err)
          rows = rows || []
          resolve(rows[0])
        })
      })
      .catch(reject)
  })
}
