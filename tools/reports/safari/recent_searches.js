const fs = require('fs')
const plist = require('../../util/plist')
const fileHash = require('../../util/backup_filehash')

const SAFARI_PLIST = fileHash('Library/Preferences/com.apple.mobilesafari.plist', 'AppDomain-com.apple.mobilesafari')

module.exports = {
  version: 4,
  name: 'safari.recent_searches',
  description: `Show Safari recent searches`,
  requiresBackup: true,

  // Run on a v3 lib / backup object
  run (lib, { backup }) {
    return safariRecentSearches(backup)
  },

  // Available fields.
  output: {
    searchString: el => el.SearchString,
    date: el => el.Date
  }
}

// Pull the recent searches out of the file
const safariRecentSearches = (backup) => {
  return new Promise((resolve, reject) => {
    try {
      // Get the filename of the ID
      var filename = backup.getFileName(SAFARI_PLIST)
      let mobilesafariPlist = plist.parseFile(filename)

      resolve(mobilesafariPlist['RecentWebSearches'])
    } catch (e) {
      reject(e)
    }
  })
}
