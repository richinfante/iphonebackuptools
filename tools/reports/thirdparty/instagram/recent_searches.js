const plist = require('../../../util/plist')
const fs = require('fs')

// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const file = fileHash('Library/Preferences/group.com.burbn.instagram.plist', 'AppDomainGroup-group.com.burbn.instagram')


module.exports = {
  version: 4,
  name: 'instagram_recent_searches',
  description: `Show Instagram recent searches coded data`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
    run (lib, { backup }) {
        return instagramRecentSearchesReport(backup)
    },

  // Fields for apps report
  output: {
          'Type': el => el.type,
          'Identifier': el => el.identifier
  }
}


const instagramRecentSearchesReport = (backup) => {
  return new Promise((resolve, reject) => {
    var results = []
    var filename = backup.getFileName(file)
    try {
      let instagramPlist = plist.parseFile(filename)
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
