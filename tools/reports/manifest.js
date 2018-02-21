const stripAnsi = require('strip-ansi')
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('../util/normalize.js')
const fs = require('fs-extra')
const chalk = require('chalk')
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
  if (program.dump) return backup.getFileManifest()
  else {
    backup.getFileManifest()
    .then((items) => {

      // Extract items for analysis on-disk.
      if (program.extract) {
        for (var item of items) {
          // Filter by the domain.
          // Simple "Contains" Search
          if (program.filter === 'all' || (program.filter && item.domain.indexOf(program.filter) > -1)) {
            // Do nothing, we'll process later.
          } else {
            // Skip to the next iteration of the loop.
            console.log(chalk.yellow('skipped'), item.relativePath)
            continue
          }

          try {
            var sourceFile = backup.getFileName(item.fileID)
            var stat = fs.lstatSync(sourceFile)

            // Only process files that exist.
            if (stat.isFile() && fs.existsSync(sourceFile)) {
              console.log(chalk.green('export'), item.relativePath)

                // Calculate the output dir.
              var outDir = path.join(program.extract, item.domain, item.relativePath)

                // Create the directory and copy
              fs.ensureDirSync(path.dirname(outDir))
              fs.copySync(sourceFile, outDir)

                // Save output info to the data item.
              item.output_dir = outDir
            } else if (stat.isDirectory()) {
              // Do nothing..
            } else {
              console.log(chalk.blue('not found'), item.relativePath)
            }
          } catch (e) {
            console.log(chalk.red('fail'), item.relativePath, e.toString())
          }
        }
      } else {
        // Otherwise, output the table of items.
        items = items.map(el => [
          el.fileID + '',
          el.domain + ': ' + el.relativePath
        ])

        items = [['ID', 'Domain/Path'], ['-'], ...items]
        items = normalizeCols(items, 1).map(el => el.join(' | ').replace(/\n/g, '')).join('\n')

        if (!program.color) { items = stripAnsi(items) }

        console.log(items)
      }
    })
    .catch((e) => {
      console.log('[!] Encountered an Error:', e)
    })
  }
}
