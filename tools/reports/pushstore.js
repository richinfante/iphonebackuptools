module.exports.name = 'pushstore'
module.exports.description = 'List pushstore files'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

// Specify this only works up to iOS 10
module.exports.supportedVersions = '<11.0'

// You can also provide an array of functions instead of using `module.exports.func`.
// These functions *should* be independent ranges to ensure reliable execution
module.exports.functions = {

  '>=10.0': function (program, backup, resolve, reject) {
    // This function would be called for iOS 10+
    backup.getPushstore()
    .then((items) => {
      var result = program.formatter.format(items, {
        program: program,
        columns: {
          'AppNotificationCreationDate': el => el.AppNotificationCreationDate,
          'AppNotificationTitle': el => el.AppNotificationTitle,
          'AppNotificationMessage': el => el.AppNotificationMessage,
          'RequestedDate': el => el.RequestedDate,
          'TriggerDate': el => el.TriggerDate
        }
      })

      resolve(result)
    })
    .catch(reject)
  },

  '>=5.0,<10.0': function (program, backup, resolve, reject) {
    // This function would be called for all iOS 5 up to iOS 9.x.
    backup.getOldPushstore()
    .then((items) => {
      var result = program.formatter.format(items, {
        program: program,
        columns: {
          'AppNotificationCreationDate': el => el.AppNotificationCreationDate,
          'AppNotificationTitle': el => el.AppNotificationTitle,
          'AppNotificationMessage': el => el.AppNotificationMessage,
          'RequestedDate': el => el.RequestedDate,
          'TriggerDate': el => el.TriggerDate
        }
      })

      resolve(result)
    })
    .catch(reject)
  }
}
