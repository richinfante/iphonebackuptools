const plist = require('../../../util/plist')
const fs = require('fs')

// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const file = fileHash('Library/Preferences/group.com.burbn.instagram.plist', 'AppDomainGroup-group.com.burbn.instagram')

module.exports = {
  version: 4,
  name: 'instagram_following_users_coded',
  description: `Show Instagram following users coded data`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
    run (lib, { backup }) {
        return instagramRecentSearchesReport(backup)
    },

  // Fields for apps report
  output: {
          'Identifier': el => el
  }
}

const instagramRecentSearchesReport = (backup) => {
  return new Promise((resolve, reject) => {
    var results = []
    var filename = backup.getFileName(file)
    try {
      let instagramPlist = plist.parseFile(filename)
      let followingUsersKey = Object.keys(instagramPlist).filter(key => key.indexOf('-following-users.coded') !== -1)
      followingUsersKey.forEach(key => {
        let followingUsers = instagramPlist[key]
        results.push(...followingUsers)
      })

      resolve(results)
    } catch (e) {
      reject(e)
    }
  })
}
