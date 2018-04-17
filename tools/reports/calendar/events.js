// Derive filenames based on domain + file path
const fileHash = require('../../util/backup_filehash')

const CAL_DB = fileHash('Library/Calendar/Calendar.sqlitedb')

module.exports = {
  version: 3,
  name: 'calendar.events',
  description: `List all calendar entries`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
  run (lib, { backup }) {
    return calendarReport(backup)
  },

  // Fields for apps report
  output: {
    timestamp: el => (new Date((el.start_date + 978307200) * 1000).toDateString()) + ' ' + (new Date((el.start_date + 978307200) * 1000).toTimeString()),
    title: el => el.summary,
    content: el => el.description,
    calendarId: el => el.calendar_id,
    calendarTitle: el => el.calendar_title
  }
}

function calendarReport (backup) {
  return new Promise((resolve, reject) => {
    backup.openDatabase(CAL_DB)
      .then(db => {
        const query = `
        SELECT
          CalendarItem.*,
          Calendar.title as calendar_title
        FROM CalendarItem
        LEFT JOIN Calendar ON
          Calendar.ROWID = CalendarItem.calendar_id
        ORDER BY start_date
        `
        db.all(query, async function (err, rows) {
          if (err) reject(err)

          resolve(rows)
        })
      })
      .catch(reject)
  })
}
