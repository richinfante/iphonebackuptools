const { URL } = require('url')
const fileHash = require('../../util/backup_filehash')
const HISTORY_DB = fileHash('Library/Safari/History.db', 'AppDomain-com.apple.mobilesafari')

module.exports = {
  version: 4,
  name: 'safari.webhistory',
  description: `List all web history`,
  requiresBackup: true,

  // Run on a v3 lib / backup object
  run (lib, { backup }) {
    return getWebHistory(backup)
  },

  // Available fields.
  output: {
    timestamp: el => el.XFORMATTEDDATESTRING,
    origin: el => new URL(el.url || '').origin || '',
    url: el => el.url,
    title: el => (el.title || '')
  }
}

/// Get all web history entries.
function getWebHistory (backup) {
  return new Promise((resolve, reject) => {
    backup.openDatabase(HISTORY_DB)
      .then(db => {
        db.all(`SELECT *, datetime(visit_time + 978307200, 'unixepoch') AS XFORMATTEDDATESTRING from history_visits LEFT JOIN history_items ON history_items.ROWID = history_visits.history_item`, function (err, rows) {
          if (err) reject(err)

          resolve(rows)
        })
      })
      .catch(reject)
  })
}
