const fs = require('fs')
const bplist = require('bplist-parser')
const fileHash = require('../../util/backup_filehash')

const SAFARI_PLIST = fileHash('Library/Preferences/com.apple.mobilesafari.plist', 'AppDomain-com.apple.mobilesafari')

module.exports = {
  version: 3,
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
      let mobilesafariPlist = bplist.parseBuffer(fs.readFileSync(filename))[0]

      resolve(mobilesafariPlist['RecentWebSearches'])
    } catch (e) {
      reject(e)
    }
  })
}
