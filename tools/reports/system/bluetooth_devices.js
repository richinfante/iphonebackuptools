const fileHash = require('../../util/backup_filehash')
const log = require('../../util/log')

const PAIRED_DB = fileHash('Library/Database/com.apple.MobileBluetooth.ledevices.paired.db', 'SysSharedContainerDomain-systemgroup.com.apple.bluetooth')
const OTHER_DB = fileHash('Library/Database/com.apple.MobileBluetooth.ledevices.other.db', 'SysSharedContainerDomain-systemgroup.com.apple.bluetooth')

module.exports = {
  version: 3,
  name: 'system.bluetooth_devices',
  description: `List known bluetooth devices`,
  requiresBackup: true,

  // Run on a v3 lib / backup object
  run (lib, { backup }) {
    return getBluetoothDevices(backup)
  },

  // Available fields.
  output: {
    uuid: el => el.Uuid || null,
    name: el => el.Name ? el.Name : 'N/A',
    macAddress: el => {
      let address = el.ResolvedAddress ? el.ResolvedAddress : el.Address ? el.Address : 'N/A'
      address = address.indexOf(' ') !== -1 ? address.split(' ')[1] : address
      return address
    },
    lastConnected: el => el.LastConnectionTime || 0,
    lastSeen: el => el.LastSeenTime || 0,
    paired: el => el.Paired ? el.Paired : 'No'
  }
}

// Get the bluetooth devices in a backup.
function getBluetoothDevices (backup) {
  return new Promise(async (resolve, reject) => {
    // Get paired devices
    try {
      var paired = await getPairedDevices(backup)
    } catch (e) {
      log.verbose(`couldn't get paired devices`, e)
    }

    // Get other devices
    try {
      var other = await getOtherDevices(backup)
    } catch (e) {
      log.verbose(`couldn't get paired devices`, e)
    }

    // console.log(paired, other)
    resolve([...paired, ...other])
  })
}

// Get devies we've paired with
function getPairedDevices (backup) {
  return new Promise((resolve, reject) => {
    backup.openDatabase(PAIRED_DB)
      .then(paired => {
        const query = `SELECT *, 'Yes' as Paired FROM PairedDevices`
        paired.all(query, function (err, rows) {
          if (err) reject(err)

          resolve(rows)
        })
      })
      .catch(reject)
  })
}

// Get other devices we've seen.
function getOtherDevices (backup) {
  return new Promise((resolve, reject) => {
    backup.openDatabase(OTHER_DB)
      .then(paired => {
        const query = `SELECT * FROM OtherDevices`
        paired.all(query, function (err, rows) {
          if (err) reject(err)

          resolve(rows)
        })
      })
      .catch(reject)
  })
}
