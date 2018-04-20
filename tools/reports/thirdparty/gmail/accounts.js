const log = require('../../../util/log')
const path = require('path')
const sqlite3 = require('sqlite3')
const bplist = require('bplist-parser')
const fs = require('fs')
const plist = require('plist')

// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const file = fileHash('Library/Preferences/group.com.google.Gmail.plist', 'AppDomainGroup-group.com.google.Gmail')

module.exports.name = 'gmail_accounts'
module.exports.description = 'Show Gmail account(s) information'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = function (program, backup, resolve, reject) {
  gmailAccountsReport(backup)
    .then((items) => {
      var result = program.formatter.format(items, {
        program: program,
        columns: {
          'Id': el => el.id,
          'Email': el => el.email,
          'Avatar': el => el.avatar || null
        }
      })

      resolve(result)
    })
    .catch(reject)
}

const gmailAccountsReport = (backup) => {
  return new Promise((resolve, reject) => {
    var filename = backup.getFileName(file)
    try {
      let gmailPlist = bplist.parseBuffer(fs.readFileSync(filename))[0]
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
