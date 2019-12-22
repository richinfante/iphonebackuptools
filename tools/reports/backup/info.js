const fs = require('fs')
const path = require('path')

const log = require('../../util/log')
const plist = require('../../util/plist')

module.exports = {
  version: 4,
  name: 'backup.info',
  description: `Gets a backup's info`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
  async run (lib, { backup }) {
    // Get the path for the info plist.
    let infoPath = path.join(backup.path, 'Info.plist')

    log.verbose('parsing info', infoPath)
    var data = plist.parseFile(infoPath)

    // Remove this data, it's kind of useless.
    delete data['iTunes Files']

    return data
  },

  // Public facing properties
  output: {
    buildVersion: el => el['Build Version'],
    deviceName: el => el['Device Name'],
    displayName: el => el['Display Name'],
    guid: el => el['GUID'],
    installedApplications: el => el['Installed Applications'],
    lastBackupDate: el => el['Last Backup Date'],
    productName: el => el['Product Name'],
    productType: el => el['Product Type'],
    productVersion: el => el['Product Version'],
    serialNumber: el => el['Serial Number'],
    targetIdentifier: el => el['Target Identifier'],
    targetType: el => el['Target Type'],
    uniqueIdentifier: el => el['Unique Identifier'],
    iTunesSettings: el => el['iTunes Settings'],
    iTunesVersion: el => el['iTunes Version']
  }
}
