module.exports.name = 'calls_statistics'
module.exports.description = 'Get statistics about all calls'

// Specify this reporter requires a backup. 
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

// Specify this only works for iOS 7 and earlier
module.exports.supportedVersions = '<=7.1.2'

module.exports.func = function (program, backup, resolve, reject) {
  backup.getCallsStatistics()
    .then((items) => {

      var result = program.formatter.format(items, {
        program: program,
        columns: {
          'Key': el => el.key + '',
          'Value': el => el.value + ''
        }
      })

      resolve(result)

    })
    .catch(reject)
}
