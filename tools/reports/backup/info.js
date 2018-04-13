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
  }
}
