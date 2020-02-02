const fs = require('fs')
const plist = require('../../util/plist')
const pushstoreParse = require('../../util/pushstore_parse')

module.exports = {
  version: 4,
  name: 'system.pushstore',
  description: `List pushstore contents`,
  requiresBackup: true,

  // Available fields.
  output: {
    appNotificationCreationDate: el => el.AppNotificationCreationDate,
    appNotificationTitle: el => el.AppNotificationTitle,
    appNotificationMessage: el => el.AppNotificationMessage,
    requestedDate: el => el.RequestedDate,
    triggerDate: el => el.TriggerDate
  },

  // Run on a v3 lib / backup object
  run (lib, { backup }) {
    return new Promise(async (resolve, reject) => {
      try {
        // Run files report as a sub-report.
        let files = await lib.run('backup.files', { backup })

        files = files.filter((file) => {
          if (file.path) {
            return ~file.path.indexOf('Library/SpringBoard/PushStore/')
          }
          return false
        })

        // Collect the push stores
        const pushstores = []

        // For each file, run a parse on the plist.
        files.forEach((file) => {
          let data = plist.parseFile(backup.getFileName(file.id))
          pushstores.push(...pushstoreParse.run(data))
        })

        resolve(pushstores)
      } catch (e) {
        reject(e)
      }
    })
  }
}
