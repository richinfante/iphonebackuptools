const fs = require('fs-extra')

module.exports = {
  version: 3,
  name: 'list',
  description: 'List of all backups',

  run (lib, { raw }) {
    return new Promise(async (resolve, reject) => {
      let files = fs.readdirSync(lib.base, { encoding: 'utf8' })
        .filter(el => (el !== '.DS_Store'))

      var results = []

      // Iterate over the file list and try to get statuses for each backup.
      for (let id of files) {
        var result = { id }

        try {
          result.status = await lib.run('backup.status', { backup: id, raw })
        } catch (e) {}

        try {
          result.info = await lib.run('backup.info', { backup: id, raw })
        } catch (e) {}

        try {
          result.manifest = await lib.run('backup.manifest', { backup: id, raw })
        } catch (e) {}

        results.push(result)
      }

      resolve(results)
    })
  },

  output: {
    udid: el => el.id,
    encrypted: el => el.manifest ? (!!el.manifest.IsEncrypted) : false,
    date: el => el.status ? new Date(el.status.Date).toLocaleString() : '',
    deviceName: el => el.manifest ? el.manifest.Lockdown.DeviceName : 'Unknown Device',
    serialNumber: el => el.manifest.Lockdown.SerialNumber,
    iOSVersion: el => el.manifest ? el.manifest.Lockdown.ProductVersion : '?',
    backupVersion: el => el.status ? el.status.Version : '?'
  }
}
