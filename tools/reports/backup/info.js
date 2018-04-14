const fs = require('fs')
const path = require('path')
const plist = require('plist')
const bplist = require('bplist-parser')

const log = require('../../util/log')

module.exports = {
  version: 3,
  name: 'backup.info',
  description: `Gets a backup's info`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
  run (lib, { backup }) {
    return new Promise((resolve, reject) => {
      // This isn't ALWAYS a normal PLIST file.
      // We must check the header if it's equal to bplist0
      try {
        let infoPath = path.join(backup.path, 'Info.plist')

        let fd = fs.openSync(infoPath, 'r')
        let buffer = Buffer.alloc(7)
        // Read the first 7 bytes into the buffer.
        fs.readSync(fd, buffer, 0, 7, 0)
        fs.closeSync(fd)

        var data
        // Binary plists have the marker 'bplist0'
        if (buffer.toString('ascii') === 'bplist0') {
          // Parse as binary plist
          log.verbose('parsing manifest', infoPath)
          data = bplist.parseBuffer(fs.readFileSync(infoPath))[0]

          // Remove this data, it's kind of useless.
          delete data['iTunes Files']
        } else {
          // Parse as normal plist.
          log.verbose('parsing info', infoPath)
          data = plist.parse(fs.readFileSync(infoPath, 'utf8'))

          delete data['iTunes Files']
        }

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
