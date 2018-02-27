const stripAnsi = require('strip-ansi')
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('../util/normalize.js')
const fs = require('fs-extra')
const chalk = require('chalk')
const path = require('path')
module.exports.name = 'manifest'
module.exports.description = 'List all the files contained in the backup (iOS 5+)'

// Specify this reporter requires a backup. 
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

// Specify this only works for iOS 5+
module.exports.supportedVersions = '>=5.0'

// You can also provide an array of functions instead of using `module.exports.func`.
// These functions *should* be independent ranges to ensure reliable execution
module.exports.functions = {
  '>=10.0': function(program,backup,resolve,reject) {
    // This function would be called for iOS 10+
      
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

        resolve(result)
      } else {

        var result = program.formatter.format(items, {
          program: program,
          columns: {
            'ID': el => el.fileID,
            'Domain/Path': el => el.domain + ': ' + el.relativePath
          }
        })

        resolve(result)
      }
    })
    .catch((e) => {
        console.log('[!] Encountered an Error:', e)
    })
  }, 

  '>=5.0,<10.0': function(program,backup,resolve,reject) {
    // This function would be called for all iOS 5 up to iOS 9.x.
    backup.getOldFileManifest()
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
            console.log(chalk.yellow('skipped'), item.filename)
            continue
          }

          try {
            var sourceFile = backup.getFileName(item.fileID)
            var stat = fs.lstatSync(sourceFile)

            // Only process files that exist.
            if (stat.isFile() && fs.existsSync(sourceFile)) {
              console.log(chalk.green('export'), item.filename)

                // Calculate the output dir.
              var outDir = path.join(program.extract, item.domain, item.filename)

                // Create the directory and copy
              fs.ensureDirSync(path.dirname(outDir))
              fs.copySync(sourceFile, outDir)

                // Save output info to the data item.
              item.output_dir = outDir
            } else if (stat.isDirectory()) {
              // Do nothing..
            } else {
              console.log(chalk.blue('not found'), item.filename)
            }
          } catch (e) {
            console.log(chalk.red('fail'), item.filename, e.toString())
          }
        }

        resolve(result)
      } else {
        var result = program.formatter.format(items, {
          program: program,
          columns: {
            'ID': el => el.fileID,
            'Domain/Path': el => (el.domain + ': ' + el.filename).substr(0,70),
            'Size': el => el.filelen
          }
        })

        resolve(result)
      }
    })
    .catch(reject)
  }
}
