const stripAnsi = require('strip-ansi')
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('../util/normalize.js')
const fs = require('fs-extra')
const path = require('path')
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

      if (program.extract) {
        for (var item of items) {
          try {
            
            var sourceFile = backup.getFileName(item.fileID)
            console.log('export', sourceFile)
            if (fs.existsSync(sourceFile)) {
              var outDir = path.join(program.extract, item.domain, item.relativePath)
              fs.ensureDirSync(path.dirname(outDir))
              fs.createReadStream(sourceFile).pipe(fs.createWriteStream(outDir))
              item.output_dir = outDir
              console.log(outDir)
            } else {
              console.log(item.relativePath, 'does not exist, skipping.')
            }
          } catch (e) {
            console.log(`Couldn't Export: ${item.relativePath}`, e)
          }
        }
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
