const stripAnsi = require('strip-ansi')
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('../util/normalize.js')

module.exports.name = 'photolocations'
module.exports.description = 'List all geolocation information for iOS photos (iOS 10+)'

module.exports.func = function (program, base) {
  if (!program.backup) {
    console.log('use -b or --backup <id> to specify backup.')
    process.exit(1)
  }

// Grab the backup
  var backup = iPhoneBackup.fromID(program.backup, base)
  if (program.dump) return backup.getPhotoLocationHistory(program.dump)
  else {
    backup.getPhotoLocationHistory(program.dump)
      .then((history) => {
        if (program.dump) {
          return history
        }

        var items = history.map(el => [
          el.XFORMATTEDDATESTRING + '' || '',
          el.ZLATITUDE + '' || '',
          el.ZLONGITUDE + '' || '',
          el.ZFILENAME + '' || ''
        ])

        items = [['Time', 'Latitude', 'Longitude', 'Photo Name'], ['-', '-', '-'], ...items]
        items = normalizeCols(items).map(el => el.join(' | ').replace(/\n/g, '')).join('\n')

        if (!program.color) { items = stripAnsi(items) }

        console.log(items)
      })
      .catch((e) => {
        console.log('[!] Encountered an Error:', e)
      })
  }
}
