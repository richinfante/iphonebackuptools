module.exports.name = 'calls_statistics'
module.exports.description = 'Get statistics about all calls'

// Specify this reporter requires a backup. 
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

// You can also provide an array of functions instead of using `module.exports.func`.
// These functions *should* be independent ranges to ensure reliable execution
module.exports.functions = {
  '>=9.0': function(program,backup,resolve,reject) {
    // This function would be called for iOS 10+
    backup.getCallsStatistics()
    .then((items) => {
      
      var result = program.formatter.format(Object.entries(items[0]), {
        program: program,
        columns: {
          'Key': el => el[0] + '',
          'Value': el => el[1] + ''
        }
      })

      resolve(result)

    })
    .catch(reject)
  }, 
  '>=1.0,<9.0': function(program,backup,resolve,reject) {
    // This function would be called for all iOS 9.
    backup.getCallsStatisticsiOS7()
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
}