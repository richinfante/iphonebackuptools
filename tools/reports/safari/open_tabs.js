const fileHash = require('../../util/backup_filehash')

const TABS_DB = fileHash('Library/Safari/BrowserState.db', 'AppDomain-com.apple.mobilesafari')

module.exports = {
  version: 3,
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
    lastViewedTime: el => (new Date((el.last_viewed_time + 978307200) * 1000).toDateString()) + ' ' + (new Date((el.last_viewed_time + 978307200) * 1000).toTimeString())
  }
}

const openTabsReport = (backup) => {
  return new Promise((resolve, reject) => {
    backup.openDatabase(TABS_DB)
      .then(db => {
        db.all(`
          select * from tabs
          order by last_viewed_time DESC
          `, function (err, rows) {
          if (err) reject(err)

          resolve(rows)
        })
      })
      .catch(reject)
  })
}
