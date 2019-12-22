const plist = require('../../../util/plist')
const fs = require('fs')

// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const file = fileHash('Library/Preferences/group.com.google.Gmail.plist', 'AppDomainGroup-group.com.google.Gmail')


module.exports = {
  version: 4,
  name: 'gmail_accounts',
  description: `Show Gmail account(s) information`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
    run (lib, { backup }) {
        return gmailAccountsReport(backup)
    },

  // Fields for apps report
  output: {
          'Id': el => el.id,
          'Email': el => el.email,
          'Avatar': el => el.avatar || null
  }
}



const gmailAccountsReport = (backup) => {
  return new Promise((resolve, reject) => {
    var filename = backup.getFileName(file)
    try {
      let gmailPlist = plist.parseFile(filename)
      let gmailAccountIds = Object.keys(gmailPlist).filter(key => key.indexOf('kIdToEmailMapKey') !== -1)
      let gmailAvatars = Object.keys(gmailPlist).filter(key => key.indexOf('kCurrentAvatarUrlKey') !== -1)
      gmailAvatars = gmailAvatars.map(avatarKey => {
        let id = avatarKey.split('kCurrentAvatarUrlKey')[1].split('-')
        id = id[id.length - 1]
        return {
          avatarKey: avatarKey,
          accountId: id
        }
      })

      gmailAccountIds = gmailAccountIds.map(key => {
        const split = key.split('-')
        let avatar = gmailAvatars.find(avatar => avatar.accountId === split[split.length - 1])
        return {
          id: split[split.length - 1],
          email: gmailPlist[key],
          avatar: gmailPlist[(avatar || {}).avatarKey]
        }
      })

      resolve(gmailAccountIds)
    } catch (e) {
      reject(e)
    }
  })
}
