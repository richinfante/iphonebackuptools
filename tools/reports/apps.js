const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup

module.exports.name = 'apps'
module.exports.description = 'List all installed applications and container IDs.'

module.exports.func = function (program, base) {
  if (!program.backup) {
    console.log('use -b or --backup <id> to specify backup.')
    process.exit(1)
  }

        // Grab the backup
  var backup = iPhoneBackup.fromID(program.backup, base)

  if (!backup.manifest) return {}

        // Possibly dump output
  if (program.dump) {
    console.log(JSON.stringify(backup.manifest, null, 4))
    return
  }

        // Enumerate the apps in the backup
  var apps = []
  for (var key in backup.manifest.Applications) {
    apps.push(key)
  }

  console.log(`Apps installed inside backup: ${backup.id}`)
  console.log(apps.map(el => '- ' + el).join('\n'))
}
