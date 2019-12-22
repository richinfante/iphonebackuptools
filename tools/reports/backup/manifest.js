const fs = require('fs')
const path = require('path')

const log = require('../../util/log')
const plist = require('../../util/plist')

module.exports = {
  version: 4,
  name: 'backup.manifest',
  description: `Gets a backup's manifest plist`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
  async run (lib, { backup }) {
    // Load and parse the maniest for the backup.
    log.verbose('parsing manifest', backup.path)
    let data = plist.parseFile(path.join(backup.path, 'Manifest.plist'))

    // Remove this data, it's kind of useless.
    delete data['BackupKeyBag']

    return data
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
