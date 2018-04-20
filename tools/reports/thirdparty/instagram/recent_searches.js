const bplist = require('bplist-parser')
const fs = require('fs')

// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const file = fileHash('Library/Preferences/group.com.burbn.instagram.plist', 'AppDomainGroup-group.com.burbn.instagram')

module.exports.name = 'instagram_recent_searches'
module.exports.description = 'Show Instagram recent searches coded data'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = function (program, backup, resolve, reject) {
  instagramRecentSearchesReport(backup)
    .then((items) => {
      var result = program.formatter.format(items, {
        program: program,
        columns: {
          'Type': el => el.type,
          'Identifier': el => el.identifier
        }
      })

      resolve(result)
    })
    .catch(reject)
}

const instagramRecentSearchesReport = (backup) => {
  return new Promise((resolve, reject) => {
    var results = []
    var filename = backup.getFileName(file)
    try {
      let instagramPlist = bplist.parseBuffer(fs.readFileSync(filename))[0]
      let recentSearchesKey = Object.keys(instagramPlist).filter(key => key.indexOf('-blended-search-recent-item-order') !== -1)
      recentSearchesKey.forEach(key => {
        let recentSearches = instagramPlist[key]
        results.push(...recentSearches)
      })

      resolve(results)
    } catch (e) {
      reject(e)
    }
  })
}
