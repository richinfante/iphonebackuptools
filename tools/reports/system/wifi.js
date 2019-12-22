const plist = require('../../util/plist')
const fs = require('fs')

// Normalize mac addresses in wifi output
const macParse = require('../../util/mac_address_parse')

// Derive filenames based on domain + file path
const fileHash = require('../../util/backup_filehash')

const WIFI_PLIST = fileHash('SystemConfiguration/com.apple.wifi.plist', 'SystemPreferencesDomain')

module.exports = {
  version: 4,
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
        let wifiList = plist.parseFile(filename)
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

  // Wifi Report Fields.
  output: {
    lastJoined: el => el.lastJoined,
    lastAutoJoined: el => el.lastAutoJoined || '',
    ssid: el => el.SSID_STR,
    bssid: el => el.BSSID,
    security: el => el.SecurityMode || '',
    hidden: el => !!el.HIDDEN_NETWORK,
    enabled: el => !!el.enabled
  }
}
