
const bplist = require('bplist-parser')
const fs = require('fs')

// Derive filenames based on domain + file path
const fileHash = require('../../util/backup_filehash')

const file = fileHash('Library/Preferences/com.apple.mobilephone.speeddial.plist')

module.exports = {
  version: 3,
  name: 'phone.speed_dial',
  description: `Show Speed dial contact information`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
  run (lib, { backup }) {
    return speedDialReport(backup)
  },

  // Public facing properties
  output: {
    actionType: el => {
      // Preprocess action type
      if (el.ActionType) {
        if (el.ActionType.indexOf('ActionType') !== -1) {
          return el.ActionType.split('ActionType')[0]
        } else {
          return el.ActionType
        }
      } else {
        return 'N/A'
      }
    },
    contactName: el => el.Name,
    value: el => el.Value
  }
}

const speedDialReport = (backup) => {
  return new Promise((resolve, reject) => {
    try {
      var filename = backup.getFileName(file)
      let speeddialPlist = bplist.parseBuffer(fs.readFileSync(filename))[0]

      resolve(speeddialPlist)
    } catch (e) {
      reject(e)
    }
  })
}
