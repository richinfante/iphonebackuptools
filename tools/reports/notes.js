const stripAnsi = require('strip-ansi')
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('../util/normalize.js')

module.exports.name = 'notes'
module.exports.description = 'List all iOS notes'

// Specify this only works for iOS 10+
module.exports.supportedVersions = '>=9.0'

// Specify this reporter requires a backup. 
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = function (program, backup, resolve, reject) {
  backup.getNotes(program.dump)
    .then((items) => {
      // Format the output
      var result = program.formatter.format(items, {
        program: program,
        columns: {
          'Modified': el => (el.XFORMATTEDDATESTRING || el.XFORMATTEDDATESTRING1) + '',
          'ID': el => el.Z_PK,
          'Title2': el => (el.ZTITLE2 + '').trim().substring(0, 128),
          'Title1': el => (el.ZTITLE1 + '').trim() || ''
        }
      })

      resolve(result)
    })
    .catch(reject)
}