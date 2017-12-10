const stripAnsi = require('strip-ansi')
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('../util/normalize.js')
const path = require('path')
const fs = require('fs-extra')

module.exports.name = 'voicemail-files'
module.exports.description = 'List all or extract voicemail files (iOS 10+)'

module.exports.func = function (program, base) {
  if (!program.backup) {
    console.log('use -b or --backup <id> to specify backup.')
    process.exit(1)
  }

// Grab the backup
  var backup = iPhoneBackup.fromID(program.backup, base)
  backup.getVoicemailFileList()
    .then((list) => {
      if (program.dump) {
        console.log(JSON.stringify(list, null, 4))
        return
      }

      if (program.extract) {
        for (var item of list) {
          try {
            var outDir = path.join(program.extract, path.basename(item.relativePath))
            fs.ensureDirSync(path.dirname(outDir))
            fs.createReadStream(backup.getFileName(item.fileID)).pipe(fs.createWriteStream(outDir))
            item.output_dir = outDir
          } catch (e) {
            console.log(`Couldn't Export: ${item.relativePath}`, e)
          }
        }
      }

      var items = list.map(el => [
        el.fileID + '',
        el.relativePath,
        el.output_dir || '<not exported>'
      ])

      items = [['ID', 'Path', 'Exported Path'], ['-', '-', '-'], ...items]
      items = normalizeCols(items).map(el => el.join(' | ').replace(/\n/g, '')).join('\n')

      if (!program.color) { items = stripAnsi(items) }

      console.log(items)
    })
    .catch((e) => {
      console.log('[!] Encountered an Error:', e)
    })
}
