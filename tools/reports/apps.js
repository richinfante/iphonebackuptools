const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup

module.exports.name = 'apps'
module.exports.description = 'List all installed applications and container IDs.'

// Specify this reporter requires a backup. 
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = function (program, backup, resolve, reject) {

  if (!backup.manifest) return reject(new Error('Manifest does not exist in this version'))

  // Enumerate the apps in the backup
  var apps = []
  for (var key in backup.manifest.Applications) {
    var app = backup.manifest.Applications[key]

    apps.push({ bundleID: app.CFBundleIdentifier, path:  app.Path})
  }

  var result = program.formatter.format(apps, {
    program: program,
    columns: {
      'Bundle ID': el => el.bundleID,
      'Bundle Path': el => el.path
    }
  })

  resolve(result)
}
