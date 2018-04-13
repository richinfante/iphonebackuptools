const bplist = require('bplist-parser')
const fs = require('fs')

// Normalize mac addresses in wifi output
const macParse = require('../../util/mac_address_parse')

// Derive filenames based on domain + file path
const fileHash = require('../../util/backup_filehash')

const WIFI_PLIST = fileHash('SystemConfiguration/com.apple.wifi.plist', 'SystemPreferencesDomain')

module.exports = {
  version: 3,
  name: 'system.wifi',
  description: `List associated wifi networks and their usage information`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
  run (lib, { backup }) {
    return new Promise((resolve, reject) => {
      try {
        // Get the fifi file
        var filename = backup.getFileName(WIFI_PLIST)

        // Attempt to parse it
        let wifiList = bplist.parseBuffer(fs.readFileSync(filename))[0]
        let result = wifiList['List of known networks']
          .map(el => {
            if (el.BSSID) {
              el.BSSID = macParse.pad_zeros(el.BSSID) + ''
            }
            return el
          })
        resolve(result)
      } catch (e) {
        reject(e)
      }
    })
  },

  localizations: {
    'Last Joined': el => el.lastJoined,
    'Last AutoJoined': el => el.lastAutoJoined,
    'SSID': el => el.SSID_STR,
    'BSSID': el => el.BSSID,
    'Security': el => el.SecurityMode || '',
    'Hidden': el => el.HIDDEN_NETWORK || '',
    'Enabled': el => el.enabled ? true : false
  }
}
