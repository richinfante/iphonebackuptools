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
    resolve({...ios7stats, ...newerIOS})
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
          resolve(rows[0])
        })
      })
      .catch(reject)
  })
}

// module.exports.name = 'calls_statistics'
// module.exports.description = 'Get statistics about all calls'

// // Specify this reporter requires a backup.
// // The second parameter to func() is now a backup instead of the path to one.
// module.exports.requiresBackup = true

// // Specify this reporter supports the promises API for allowing chaining of reports.
// module.exports.usesPromises = true

// // You can also provide an array of functions instead of using `module.exports.func`.
// // These functions *should* be independent ranges to ensure reliable execution
// module.exports.functions = {
//   '>=9.0': function (program, backup, resolve, reject) {
//     // This function would be called for iOS 10+
//     backup.getCallsStatistics()
//       .then((items) => {
//         var result = program.formatter.format(Object.entries(items[0]), {
//           program: program,
//           columns: {
//             'Key': el => el[0] + '',
//             'Value': el => el[1] + ''
//           }
//         })

//         resolve(result)
//       })
//       .catch(reject)
//   },
//   '>=1.0,<9.0': function (program, backup, resolve, reject) {
//     // This function would be called for all iOS 9.
//     backup.getCallsStatisticsiOS7()
//       .then((items) => {
//         var result = program.formatter.format(items, {
//           program: program,
//           columns: {
//             'Key': el => el.key + '',
//             'Value': el => el.value + ''
//           }
//         })

//         resolve(result)
//       })
//       .catch(reject)
//   }
// }
