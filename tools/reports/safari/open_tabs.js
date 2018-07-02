const fileHash = require('../../util/backup_filehash')
const apple_timestamp = require('../../util/apple_timestamp')

const TABS_DB = fileHash('Library/Safari/BrowserState.db', 'AppDomain-com.apple.mobilesafari')

module.exports = {
  version: 4,
  name: 'safari.open_tabs',
  description: `List open Safari tabs when backup was made`,
  requiresBackup: true,

  // Run on a v3 lib / backup object
  run (lib, { backup }) {
    return openTabsReport(backup)
  },

  // Available fields.
  output: {
    title: el => el.title,
    url: el => el.url,
    lastViewedTime: el => el.last_viewed
  }
}

const openTabsReport = (backup) => {
  return new Promise((resolve, reject) => {
    backup.openDatabase(TABS_DB)
      .then(db => {
        db.all(`
          select *, ${apple_timestamp.parse('last_viewed_time')} as last_viewed from tabs
          order by last_viewed_time DESC
          `, function (err, rows) {
          if (err) reject(err)

          resolve(rows)
        })
      })
      .catch(reject)
  })
}
