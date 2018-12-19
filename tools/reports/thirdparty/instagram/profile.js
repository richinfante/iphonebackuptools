const bplist = require('bplist-parser')
const fs = require('fs')

// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const file = fileHash('Library/Preferences/com.burbn.instagram.plist', 'AppDomain-com.burbn.instagram')

module.exports = {
  version: 4,
  name: 'instagram_profile',
  description: `Show Instagram profile/user data`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
    run (lib, { backup }) {
        return instagramProfileReport(backup)
    },

  // Fields for apps report
  output: {
          'Key': el => el.key,
          'Value': el => el.value
  }
}


function KeyValue (property, plist) {
  this.key = property
  this.value = plist[property] ? plist[property] : 'N/A'
}

const instagramProfileReport = (backup) => {
  return new Promise((resolve, reject) => {
    var results = []
    var filename = backup.getFileName(file)
    try {
      let instagramPlist = bplist.parseBuffer(fs.readFileSync(filename))[0]

      results.push(new KeyValue('last-logged-in-username', instagramPlist))
      results.push(new KeyValue('prefill_fb_email', instagramPlist))
      results.push(new KeyValue('prefill_fb_phone', instagramPlist))

      resolve(results)
    } catch (e) {
      reject(e)
    }
  })
}
