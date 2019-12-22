const fs = require('fs-extra')

module.exports = {
  version: 4,
  name: 'backups.list',
  description: 'List of all backups',

  run (lib) {
    return new Promise(async (resolve, reject) => {
      let files = fs.readdirSync(lib.base, { encoding: 'utf8' })
        .filter(el => (el !== '.DS_Store'))

      var results = []

      // Iterate over the file list and try to get statuses for each backup.
      for (let id of files) {
        var result = { id }

        result.status = await lib.run('backup.status', { backup: id }).catch(() => {}) || {}
        result.info = await lib.run('backup.info', { backup: id }).catch(() => {}) || {}
        result.manifest = await lib.run('backup.manifest', { backup: id }).catch(() => {}) || {}

        results.push(result)
      }

      resolve(results)
    })
  },

  output: {
    udid: el => el.id,
    encrypted: el => el.manifest ? (!!el.manifest.IsEncrypted) : false,
    date: el => el.status ? new Date(el.status.date).toLocaleString() : '',
    deviceName: el => el.info ? el.info.deviceName : 'Unknown Device',
    serialNumber: el => el.info ? el.info.serialNumber : 'Unknown Serial #',
    iOSVersion: el => el.manifest && el.manifest.Lockdown ? el.manifest.Lockdown.ProductVersion : '?',
    backupVersion: el => el.status ? el.status.version : '?'
  }
}
