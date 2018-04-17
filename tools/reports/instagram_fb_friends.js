const log = require('../util/log')
const path = require('path')
const sqlite3 = require('sqlite3')
const bplist = require('bplist-parser')
const fs = require('fs')
const plist = require('plist')


// Derive filenames based on domain + file path
const fileHash = require('../util/backup_filehash')

const file = fileHash('Library/Preferences/group.com.burbn.instagram.plist', 'AppDomainGroup-group.com.burbn.instagram')

module.exports.name = 'instagram_fb_friends'
module.exports.description = 'Show Instagram and Facebook friends data'

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
          'Fb_id': el => el.fb_id,
          'Name': el => el.full_name,
          'Profile Pic': el => el.profile_pic_url,
          'Invited': el => el.is_invited
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
      let regex = /[0-9]*-fb-friends$/g;
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