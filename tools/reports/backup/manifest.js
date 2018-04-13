const fs = require('fs')
const path = require('path')

const log = require('../../util/log')
const bplist = require('bplist-parser')

module.exports = {
  version: 3,
  name: 'backup.manifest',
  description: `Gets a backup's manifest plist`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
  run (lib, { backup }) {
    return new Promise((resolve, reject) => {
      try {
        // Load and parse the maniest for the backup.
        log.verbose('parsing manifest', backup.path)
        let data = bplist.parseBuffer(fs.readFileSync(path.join(backup.path, 'Manifest.plist')))[0]

        // Remove this data, it's kind of useless.
        delete data['BackupKeyBag']

        resolve(data)
      } catch (e) {
        reject(e)
      }
    })
  },

  // Manifest fields.
  output: {
    SystemDomainsVersion: el => el.SystemDomainsVersion,
    Applications: el => el.Applications,
    Lockdown: el => {
      el = el.Lockdown
      return {
        ProductVersion: el.ProductVersion,
        BuildVersion: el.BuildVersion,
        DeviceName: el.DeviceName,
        SerialNumber: el.SerialNumber,
        ProductType: el.ProductType,
        UniqueDeviceID: el.UniqueDeviceID,
        ...el
      }
    },
    Version: el => el.Version,
    IsEncrypted: el => el.IsEncrypted,
    WasPasscodeSet: el => el.WasPasscodeSet,
    Date: el => el.Date
  }
}
