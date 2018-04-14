const bplist = require('bplist-parser')

const fileHash = require('../../util/backup_filehash')
const log = require('../../util/log')

const SMS_DB = fileHash('Library/SMS/sms.db')

module.exports = {
  version: 3,
  name: 'messages.conversations',
  description: `List all SMS and iMessage conversations`,
  requiresBackup: true,

  // Available fields.
  output: {
    id: el => el.ROWID,
    date: el => el.XFORMATTEDDATESTRING || '??',
    service: el => el.service_name + '',
    chatName: el => el.chat_identifier + '',
    displayName: el => el.display_name + ''
  },

  // Run on a v3 lib / backup object.
  run (lib, { backup }) {
    return getConversations(backup)
  }
}

function getConversationsiOS9 (backup) {
  return new Promise((resolve, reject) => {
    backup.openDatabase(SMS_DB)
      .then(db => {
        db.all(`SELECT *  FROM chat ORDER BY ROWID ASC`, async function (err, rows) {
          if (err) return reject(err)
          rows = rows || []

          // We need to do some manual parsing of these records.
          // The timestamp information is stored in a binary blob named `properties`
          // Which is formatted as a binary PLIST.
          for (var el of rows) {
            if (el.properties) el.properties = bplist.parseBuffer(el.properties)[0]

            // Interestingly, some of these do not have dates attached.
            if (el.properties) {
              el.date = new Date(el.properties.CKChatWatermarkTime * 1000)
            } else {
              el.date = new Date(0)
            }

            // Format as YY-MM-DD HH:MM:SS
            try {
              el.XFORMATTEDDATESTRING = el.date.toISOString()
                .split('T')
                .join(' ')
                .split('Z')
                .join(' ')
                .split('.')[0]
                .trim()
            } catch (e) {
              el.XFORMATTEDDATESTRING = ''
            }
          }

          // Sort by the date.
          rows = rows.sort(function (a, b) {
            return (a.date.getTime() || 0) - (b.date.getTime() || 0)
          })

          resolve(rows)
        })
      })
      .catch(reject)
  })
}

function getConversationsiOS10iOS11 (backup) {
  return new Promise((resolve, reject) => {
    backup.openDatabase(SMS_DB)
      .then(db => {
        db.all(`SELECT *, datetime(last_read_message_timestamp / 1000000000 + 978307200, 'unixepoch') AS XFORMATTEDDATESTRING FROM chat ORDER BY last_read_message_timestamp ASC`, async function (err, rows) {
          if (err) return reject(err)
          rows = rows || []

          resolve(rows)
        })
      })
      .catch(reject)
  })
}

function getConversations (backup) {
  return new Promise(async (resolve, reject) => {
    try {
      let conversations = await getConversationsiOS10iOS11(backup)
      return resolve(conversations)
    } catch (e) {
      log.verbose('failed to read sms conversations as iOS10/11 format', e)
    }

    try {
      let conversations = await getConversationsiOS9(backup)
      return resolve(conversations)
    } catch (e) {
      log.verbose('failed to read sms conversations as iOS9 format', e)
    }

    reject(new Error('No suitable SMS database found. Use -v to see error informaton.'))
  })
}
