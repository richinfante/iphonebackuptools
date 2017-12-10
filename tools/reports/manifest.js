const stripAnsi = require('strip-ansi')
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('../util/normalize.js')

module.exports.name = 'manifest'
module.exports.description = 'List all the files contained in the backup (iOS 10+)'

module.exports.func = function (program, base) {
  if (!program.backup) {
    console.log('use -b or --backup <id> to specify backup.')
    process.exit(1)
  }

// Grab the backup
  var backup = iPhoneBackup.fromID(program.backup, base)
  backup.getFileManifest()
    .then((items) => {
      if (program.dump) {
        console.log(JSON.stringify(items, null, 4))
        return
      }

      items = items.map(el => [
        el.fileID + '',
        el.domain + ': ' + el.relativePath
      ])

      items = [['ID', 'Domain/Path'], ['-'], ...items]
      items = normalizeCols(items, 1).map(el => el.join(' | ').replace(/\n/g, '')).join('\n')

      if (!program.color) { items = stripAnsi(items) }

      console.log(items)
    })
    .catch((e) => {
      console.log('[!] Encountered an Error:', e)
    })
}
