const stripAnsi = require('strip-ansi')
const iPhoneBackup = require('../util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('../util/normalize.js')
const path = require('path')
const fs = require('fs-extra')

module.exports.name = 'voicemail-files'
module.exports.description = 'List all or extract voicemail files (iOS 10+)'

// Specify this reporter requires a backup. 
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = function (program, backup, resolve, reject) {

  backup.getVoicemailFileList()
    .then((list) => {

      // Extract to the specified location
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

      // Generate report.
      var result = program.formatter.format(list, {
        program: program,
        columns: {
          'ID': el => el.fileID,
          'Path': el => el.relativePath,
          'Export Path': el => el.output_dir || '<not exported>'
        }
      })

      resolve(result)
    })
    .catch((e) => {
      console.log('[!] Encountered an Error:', e)
    })
}
