const plist = require('../../../util/plist')
const fs = require('fs')

// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const file = fileHash('Library/Preferences/group.com.google.Gmail.plist', 'AppDomainGroup-group.com.google.Gmail')


module.exports = {
  version: 4,
  name: 'gmail_shared_contacts',
  description: `Show Gmail account(s) shared contacts information`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
    run (lib, { backup }) {
        return gmailAccountsReport(backup)
    },

  // Fields for apps report
  output: {
          'Account': el => el.account,
          'Name': el => el.name,
          'Email': el => el.email,
          'Avatar': el => el.avatar
  }
}



const gmailAccountsReport = (backup) => {
  return new Promise((resolve, reject) => {
    var filename = backup.getFileName(file)
    try {
      let gmailPlist = plist.parseFile(filename)
      let gmailAccountIds = Object.keys(gmailPlist).filter(key => key.indexOf('kIdToEmailMapKey') !== -1)
      let gmailContactsByAccount = Object.keys(gmailPlist).filter(key => key.indexOf('kInboxSharedStorageContacts') !== -1)
      gmailContactsByAccount = gmailContactsByAccount.map(contactsKey => {
        let id = contactsKey.split('kInboxSharedStorageContacts')[1].split('_')
        id = id[id.length - 1]
        return {
          contactsKey: contactsKey,
          accountId: id
        }
      })

      gmailAccountIds = gmailAccountIds.map(key => {
        const split = key.split('kIdToEmailMapKey-')
        let contacts = gmailContactsByAccount.find(contacts => contacts.accountId === split[split.length - 1])
        return {
          id: split[split.length - 1],
          email: gmailPlist[key],
          contacts: gmailPlist[(contacts || {}).contactsKey]
        }
      })

      let contacts = []
      gmailAccountIds.forEach(gmailAccount => {
        gmailAccount.contacts = gmailAccount.contacts || []

        gmailAccount.contacts.forEach(contact => {
          contacts.push({
            account: gmailAccount.email,
            name: contact[0],
            email: contact[1],
            avatar: contact[2]
          })
        })
      })

      resolve(contacts)
    } catch (e) {
      reject(e)
    }
  })
}
