const bplist = require('bplist-parser')
const fs = require('fs')

// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const file = fileHash('Library/Preferences/group.com.burbn.instagram.plist', 'AppDomainGroup-group.com.burbn.instagram')


module.exports = {
  version: 4,
  name: 'instagram_fb_friends',
  description: `Show Instagram and Facebook friends data`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
    run (lib, { backup }) {
        return instagramRecentSearchesReport(backup)
    },

  // Fields for apps report
  output: {
          'Fb_id': el => el.fb_id,
          'Name': el => el.full_name,
          'Profile Pic': el => el.profile_pic_url,
          'Invited': el => el.is_invited
  }
}


const instagramRecentSearchesReport = (backup) => {
  return new Promise((resolve, reject) => {
    var results = []
    var filename = backup.getFileName(file)
    try {
      let instagramPlist = bplist.parseBuffer(fs.readFileSync(filename))[0]
      let regex = /[0-9]*-fb-friends$/g
      let fbFriendsKey = Object.keys(instagramPlist).filter(key => regex.test(key))
      console.log(fbFriendsKey)
      fbFriendsKey.forEach(key => {
        let fbFriends = instagramPlist[key]
        results.push(...fbFriends)
      })

      resolve(results)
    } catch (e) {
      reject(e)
    }
  })
}
