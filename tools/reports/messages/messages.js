const fileHash = require('../../util/backup_filehash')
const log = require('../../util/log')

const SMS_DB = fileHash('Library/SMS/sms.db')

module.exports = {
  version: 4,
  name: 'messages.messages',
  description: `List all SMS and iMessage messages in a conversation`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
  run (lib, { backup, id }) {
    return new Promise((resolve, reject) => {
      if (id === undefined) {
        return reject(new Error('You must specify an id for usage with the message report'))
      }

      resolve(getMessages(backup, id))
    })
  },

  // Available fields.
  output: {
    id: el => el.ROWID,
    date: el => el.XFORMATTEDDATESTRING,
    sender: el => el.x_sender,
    text: el => (el.text || '').trim(),
    dateRead: el => el.date_read + '',
    dateDelivered: el => el.date_delivered + '',
    isDelivered: el => !!el.is_delivered,
    isFinished: el => !!el.is_finished,
    isFromMe: el => !!el.is_from_me,
    isRead: el => !!el.is_read,
    isSent: el => !!el.is_sent,
    attachments: el => (el.attachments || []).map((at) => at.filename)
  }
}

function getMessages (backup, chatId) {
  return new Promise(async (resolve, reject) => {
    try {
      let messages = await getMessagesiOS10iOS11(backup, chatId)
      resolve(messages)
    } catch (e) {
      log.verbose('iOS 10/11 messages lookup failed', e)
    }

    try {
      let messages = await getMessagesiOS9(backup, chatId)
      resolve(messages)
    } catch (e) {
      log.verbose('iOS 9 messages lookup failed', e)
    }

    reject(new Error('No Suitable messages database or query found. Use -v to see error information'))
  })
}

function getMessagesiOS9 (backup, chatId) {
  return new Promise((resolve, reject) => {
    backup.openDatabase(SMS_DB)
      .then(db => {
        db.all(`
      SELECT 
        message.*,
        handle.id as sender_name,
        datetime(date + 978307200, 'unixepoch') AS XFORMATTEDDATESTRING
      FROM chat_message_join 
      INNER JOIN message 
        ON message.rowid = chat_message_join.message_id 
      INNER JOIN handle
        ON handle.rowid = message.handle_id
      WHERE chat_message_join.chat_id = ?`, [parseInt(chatId)],
        async function (err, chats) {
          if (err) return reject(err)

          chats = chats || []

          // Compute the user's name
          for (var i in chats) {
            var el = chats[i]
            el.x_sender = el.is_from_me ? 'Me' : el.sender_name

            // if (!el.is_from_me) {
            //   var contact = await backup.getName(el.sender_name)

            //   if (contact) {
            //     el.x_sender = `${contact.name} <${contact.query}>`
            //   }
            // }
          }

          resolve(chats)
        })
      })
      .catch(reject)
  })
}

function getMessagesiOS10iOS11 (backup, chatId) {
  return new Promise((resolve, reject) => {
    backup.openDatabase(SMS_DB)
      .then(db => {
        db.all(`
      SELECT 
        message.*,
        handle.id as sender_name,
        datetime((date_read + 978307200), 'unixepoch') as date_read,
        datetime((date_delivered + 978307200), 'unixepoch') as date_delivered,
        datetime(date / 1000000000 + 978307200, 'unixepoch') AS XFORMATTEDDATESTRING
      FROM chat_message_join 
      INNER JOIN message 
        ON message.rowid = chat_message_join.message_id 
      INNER JOIN handle
        ON handle.rowid = message.handle_id
      WHERE chat_message_join.chat_id = ?`, [parseInt(chatId)],
        async function (err, chats) {
          if (err) return reject(err)

          chats = chats || []

          // Compute the user's name
          for (var i in chats) {
            var el = chats[i]
            el.x_sender = el.is_from_me ? 'Me' : el.sender_name

            // if (!el.is_from_me) {
            //   var contact = await backup.getName(el.sender_name)

            //   if (contact) {
            //     el.x_sender = `${contact.name} <${contact.query}>`
            //   }
            // }
          }

          resolve(chats)
        })
      })
      .catch(reject)
  })
}
