const fs = require('fs')
const path = require('path')

const log = require('../../util/log')
const plist = require('plist')

module.exports = {
  version: 3,
  name: 'backup.info',
  description: `Gets a backup's info`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
  run (lib, { backup }) {
    return new Promise((resolve, reject) => {
      try {
        // Load the info plist for the backup.
        log.verbose('parsing info', path.join(backup.path, 'Info.plist'))
        let data = plist.parse(fs.readFileSync(path.join(backup.path, 'Info.plist'), 'utf8'))

        delete data['iTunes Files']

        resolve(data)
      } catch (e) {
        reject(e)
      }
    })
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
