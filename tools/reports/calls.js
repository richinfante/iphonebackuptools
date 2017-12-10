const stripAnsi = require('strip-ansi')
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('../util/normalize.js')

module.exports.name = 'calls'
module.exports.description = 'List all call records contained in the backup.'

module.exports.func = function (program, base) {
  if (!program.backup) {
    console.log('use -b or --backup <id> to specify backup.')
    process.exit(1)
  }

// Grab the backup
  var backup = iPhoneBackup.fromID(program.backup, base)
  backup.getCallsList()
    .then((items) => {
      if (program.dump) {
        console.log(JSON.stringify(items, null, 4))
        return
      }

      items = items.map(el => [
        el.Z_PK + '',
        el.XFORMATTEDDATESTRING,
        el.ZANSWERED + '',
        el.ZORIGINATED + '',
        el.ZCALLTYPE + '',
        el.ZDURATION + '',
        el.ZLOCATION + '',
        el.ZISO_COUNTRY_CODE + '',
        el.ZSERVICE_PROVIDER + '',
        (el.ZADDRESS || '').toString()
      ])

      items = [['ID', 'Date', 'Answered', 'Originated', 'Type', 'Duration', 'Location', 'Country', 'Service', 'Address'], ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-'], ...items]
      items = normalizeCols(items).map(el => el.join(' | ').replace(/\n/g, '')).join('\n')

      if (!program.color) { items = stripAnsi(items) }

      console.log(items)
    })
    .catch((e) => {
      console.log('[!] Encountered an Error:', e)
    })
}
