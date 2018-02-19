const stripAnsi = require('strip-ansi')
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('../util/normalize.js')

module.exports.name = 'notes'
module.exports.description = 'List all iOS notes'
module.exports.requiresBackup = true

module.exports.functions = {
  '>=9.0' : function (program, backup) {
    backup.getNotes(program.dump)
      .then((items) => {
        // Format the output
        program.formatter.format(items, {
          color: program.color,
          columns: {
            'Modified': el => (el.XFORMATTEDDATESTRING || el.XFORMATTEDDATESTRING1) + '',
            'ID': el => el.Z_PK,
            'Title2': el => (el.ZTITLE2 + '').trim().substring(0, 128),
            'Title1': el => (el.ZTITLE1 + '').trim() || ''
          }
        })
      })
      .catch((e) => {
        console.log('[!] Encountered an Error:', e)
      })
  }
}