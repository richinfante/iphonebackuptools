const bplist = require('bplist-parser')
const fs = require('fs')

// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const file = fileHash('Library/Preferences/group.com.google.Gmail.plist', 'AppDomainGroup-group.com.google.Gmail')

module.exports.name = 'gmail_shared_contacts'
module.exports.description = 'Show Gmail account(s) shared contacts information'

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
          'Account': el => el.account,
          'Name': el => el.name,
          'Email': el => el.email,
          'Avatar': el => el.avatar
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
