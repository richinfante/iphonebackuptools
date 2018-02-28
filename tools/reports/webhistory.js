const { URL } = require('url')

module.exports.name = 'webhistory'
module.exports.description = 'List all web history'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

// Specify this only works for iOS 9+
module.exports.supportedVersions = '>=9.0'

module.exports.func = function (program, backup, resolve, reject) {
  backup.getWebHistory(program.dump)
    .then((history) => {
      var result = program.formatter.format(history, {
        program: program,
        columns: {
          'Time': el => el.XFORMATTEDDATESTRING,
          'URL': el => new URL(el.url || '').origin || '',
          'Title': el => (el.title || '').substring(0, 64)
        }
      })

      resolve(result)
    })
    .catch(reject)
}
