const plist = require('../../../util/plist')
const fs = require('fs')

// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const file = fileHash('Library/Preferences/com.facebook.Messenger.plist', 'AppDomain-com.facebook.Messenger')


module.exports = {
  version: 4,
  name: 'facebook_profile',
  description: `Show Facebook Messenger user id`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
    run (lib, { backup }) {
        return facebookProfileReport(backup)
    },

  // Fields for apps report
  output: {
          'Facebook User ID': el => el.fbid
  }
}

const facebookProfileReport = (backup) => {
  return new Promise((resolve, reject) => {
    var filename = backup.getFileName(file)
    try {
      let facebookPlist = plist.parseFile(filename)
      let facebookUserIds = Object.keys(facebookPlist['kUserGlobalSettings'])
      facebookUserIds = facebookUserIds.map((fbid) => ({
        fbid: fbid
      }))

      resolve(facebookUserIds)
    } catch (e) {
      reject(e)
    }
  })
}
