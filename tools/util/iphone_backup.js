const path = require('path')
const sqlite3 = require('sqlite3')
const bplist = require('bplist-parser')
const fs = require('fs')
const plist = require('plist')
const tz_offset = 5

const databases = {
  SMS: '3d0d7e5fb2ce288813306e4d4636395e047a3d28',
  Contacts: '31bb7ba8914766d4ba40d6dfb6113c8b614be442',
  Calendar: '2041457d5fe04d39d0ab481178355df6781e6858',
  Reminders: '2041457d5fe04d39d0ab481178355df6781e6858',
  Notes: 'ca3bc056d4da0bbf88b5fb3be254f3b7147e639c',
  Notes2: '4f98687d8ab0d6d1a371110e6b7300f6e465bef2',
  Calls: '2b2b0084a1bc3a5ac8c27afdf14afb42c61a19ca',
  Calls2: '5a4935c78a5255723f707230a451d79c540d2741',
  Locations: '4096c9ec676f2847dc283405900e284a7c815836',
  WebHistory: 'e74113c185fd8297e140cfcf9c99436c5cc06b57',
  Photos: '12b144c0bd44f2b3dffd9186d3f9c05b917cee25',
  WiFi: 'ade0340f576ee14793c607073bd7e8e409af07a8',
  Voicemail: '992df473bbb9e132f4b3b6e4d33f72171e97bc7a'
}

var cache = {}

class iPhoneBackup {
  constructor (id, status, info, manifest, base) {
    this.id = id
    this.status = status
    this.info = info
    this.manifest = manifest
    this.base = base
  }

  // Open a backup with a specified ID
  // base is optional and will be computed if not used.
  static fromID (id, base) {
    // Get the path of the folder.
    if (base) {
      base = path.join(base, id)
    } else {
      base = path.join(process.env.HOME, '/Library/Application Support/MobileSync/Backup/', id)
    }

    // Parse manifest bplist files
    try {
      if (global.verbose) console.log('parsing status', base)
      var status = bplist.parseBuffer(fs.readFileSync(path.join(base, 'Status.plist')))[0]
    } catch (e) {
      console.log('Cannot open Status.plist', e)
    }
    try {
      if (global.verbose) console.log('parsing manifest', base)
      var manifest = bplist.parseBuffer(fs.readFileSync(path.join(base, 'Manifest.plist')))[0]
    } catch (e) {
      console.log('Cannot open Manifest.plist', e)
    }
    try {
      if (global.verbose) console.log('parsing status', base)
      var info = plist.parse(fs.readFileSync(path.join(base, 'Info.plist'), 'utf8'))
    } catch (e) {
      console.log('Cannot open Info.plist', e)
    }

    return new iPhoneBackup(id, status, info, manifest, base)
  }

  get iOSVersion () {
    return this.manifest.Lockdown.ProductVersion
  }

  getFileName (fileID, isAbsoulte) {
    isAbsoulte = isAbsoulte || false

    //const base = path.join(process.env.HOME, '/Library/Application Support/MobileSync/Backup/', this.id)
    // Return v2 filename
    if (this.status.Version < 3 || isAbsoulte) {
      return path.join(this.base, fileID)
    } else {
      // v3 has folders
      return path.join(this.base, fileID.substr(0, 2), fileID)
    }
  }
  getDatabase (fileID, isAbsoulte) {
    isAbsoulte = isAbsoulte || false

    // Get the backup folder
    // Return v2 filename
    if (this.status.Version < 3 || isAbsoulte) {
      return new sqlite3.Database(path.join(this.base, fileID), sqlite3.OPEN_READONLY)
    } else {
      // v3 has folders
      return new sqlite3.Database(path.join(this.base, fileID.substr(0, 2), fileID), sqlite3.OPEN_READONLY)
    }
  }

  queryDatabase (databaseID, sql) {
    return new Promise((resolve, reject) => {
      var messagedb = this.getDatabase(databaseID)
      messagedb.all(sql, async function (err, rows) {
        if (err) reject(err)

        resolve(rows)
      })
    })
  }

  getName (messageDest) {
    return new Promise((resolve, reject) => {
      if (messageDest.indexOf('@') === -1) {
        messageDest = messageDest.replace(/[\s+\-()]*/g, '')
        if (messageDest.length == 11 && messageDest[0] == '1') {
          messageDest = messageDest.substring(1)
        }
      }

      if (cache[messageDest] !== undefined) {
        return resolve(cache[messageDest])
      }

      var contactdb = this.getDatabase(databases.Contacts)

      contactdb.get(`SELECT 
        c0First as first,
        c1Last as last,
        c2Middle as middle,
        c15Phone as phones
        from ABPersonFullTextSearch_content WHERE c15Phone like '%${messageDest}%'`,
      (err, row) => {
        if (err) return resolve()
        if (!row) return resolve()

        var result = {
          name: [row.first, row.middle, row.last].filter(el => el != null).join(' '),
          phones: row.phones.split(' '),
          query: messageDest
        }

        if (row) cache[messageDest] = result

        resolve(result)
      })
    })
  }

  getMessagesiOS9 (chatId) {
    var backup = this
    return new Promise((resolve, reject) => {
      var messagedb = this.getDatabase(databases.SMS)

      messagedb.all(`
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

         if (!el.is_from_me) {
           var contact = await backup.getName(el.sender_name)

           if (contact) {
             el.x_sender = `${contact.name} <${contact.query}>`
           }
         }
       }

       resolve(chats)
     })
    })
  }

  getMessagesiOS10iOS11 (chatId) {
    var backup = this
    return new Promise((resolve, reject) => {
      var messagedb = this.getDatabase(databases.SMS)

      messagedb.all(`
        SELECT 
          message.*,
          handle.id as sender_name,
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

         if (!el.is_from_me) {
           var contact = await backup.getName(el.sender_name)

           if (contact) {
             el.x_sender = `${contact.name} <${contact.query}>`
           }
         }
       }

       resolve(chats)
     })
    })
  }

  getMessages (chatId) {
    if (parseInt(this.manifest.Lockdown.BuildVersion) <= 13) {
      return this.getMessagesiOS9(chatId)
    } else {
      return this.getMessagesiOS10iOS11(chatId)
    }
  }

  getConversationsiOS9 () {
    var backup = this
    return new Promise((resolve, reject) => {
      var messagedb = this.getDatabase(databases.SMS)

      messagedb.all(`SELECT *  FROM chat ORDER BY ROWID ASC`, async function (err, rows) {
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

          var contact = await backup.getName(el.chat_identifier)

          if (contact) {
            el.display_name = `${contact.name} <${contact.query}>`
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
  }

  getConversationsiOS10iOS11 () {
    return new Promise((resolve, reject) => {
      var messagedb = this.getDatabase(databases.SMS)
      messagedb.all(`SELECT *, datetime(last_read_message_timestamp / 1000000000 + 978307200, 'unixepoch') AS XFORMATTEDDATESTRING FROM chat ORDER BY last_read_message_timestamp ASC`, async function (err, rows) {
        if (err) return reject(err)
        rows = rows || []

        resolve(rows)
      })
    })
  }

  getConversations () {
    if (parseInt(this.manifest.Lockdown.BuildVersion) <= 14) {
      return this.getConversationsiOS9()
    } else {
      return this.getConversationsiOS10iOS11()
    }
  }

  getFileManifest () {
    return new Promise((resolve, reject) => {
      var messagedb = this.getDatabase('Manifest.db', true)
      messagedb.all('SELECT * from FILES', async function (err, rows) {
        if (err) reject(err)

        resolve(rows)
      })
    })
  }

  getOldNotes () {
    return new Promise((resolve, reject) => {
      var messagedb = this.getDatabase(databases.Notes)
      messagedb.all(`SELECT *, datetime(ZCREATIONDATE + 978307200, 'unixepoch') AS XFORMATTEDDATESTRING from ZNOTE LEFT JOIN ZNOTEBODY ON ZBODY = ZNOTEBODY.Z_PK`, async function (err, rows) {
        if (err) reject(err)

        resolve(rows)
      })
    })
  }

  getNewNotesiOS9 () {
    return new Promise((resolve, reject) => {
      var messagedb = this.getDatabase(databases.Notes2)
      messagedb.all(`SELECT *, datetime(ZCREATIONDATE + 978307200, 'unixepoch') AS XFORMATTEDDATESTRING FROM ZICCLOUDSYNCINGOBJECT`, async function (err, rows) {
        if (err) reject(err)

        resolve(rows)
      })
    })
  }

  getNewNotesiOS10iOS11 () {
    return new Promise((resolve, reject) => {
      var messagedb = this.getDatabase(databases.Notes2)
      messagedb.all(`SELECT *, datetime(ZCREATIONDATE + 978307200, 'unixepoch') AS XFORMATTEDDATESTRING, datetime(ZCREATIONDATE1 + 978307200, 'unixepoch') AS XFORMATTEDDATESTRING1 FROM ZICCLOUDSYNCINGOBJECT`, async function (err, rows) {
        if (err) reject(err)

        resolve(rows)
      })
    })
  }

  getNotes () {
    if (parseInt(this.manifest.Lockdown.BuildVersion) <= 13) {
      // Legacy iOS 9 support
      // May work for earlier but I haven't tested it
      return this.getNewNotesiOS9()
    } else {
      return this.getNewNotesiOS10iOS11()
    }
  }

  getWebHistory () {
    return new Promise((resolve, reject) => {
      var messagedb = this.getDatabase(databases.WebHistory)
      messagedb.all(`SELECT *, datetime(visit_time + 978307200, 'unixepoch') AS XFORMATTEDDATESTRING from history_visits LEFT JOIN history_items ON history_items.ROWID = history_visits.history_item`, async function (err, rows) {
        if (err) reject(err)

        resolve(rows)
      })
    })
  }

  getPhotoLocationHistory () {
    return new Promise((resolve, reject) => {
      var messagedb = this.getDatabase(databases.Photos)
      messagedb.all(`SELECT ZDATECREATED, ZLATITUDE, ZLONGITUDE, ZFILENAME, datetime(ZDATECREATED + 978307200, 'unixepoch') AS XFORMATTEDDATESTRING FROM ZGENERICASSET ORDER BY ZDATECREATED ASC`, async function (err, rows) {
        if (err) reject(err)

        resolve(rows)
      })
    })
  }

  getGeofencesList () {
    return new Promise((resolve, reject) => {
      var messagedb = this.getDatabase(databases.Locations)
      messagedb.all(`SELECT datetime(Timestamp + 978307200, 'unixepoch') AS XFORMATTEDDATESTRING, Latitude, Longitude, Distance FROM Fences ORDER BY Timestamp ASC`, async function (err, rows) {
        if (err) reject(err)

        resolve(rows)
      })
    })
  }

  getCallsList () {
    return new Promise((resolve, reject) => {
      var messagedb = this.getDatabase(databases.Calls2)
      messagedb.all(`SELECT *, datetime(ZDATE + 978307200, 'unixepoch') AS XFORMATTEDDATESTRING from ZCALLRECORD ORDER BY ZDATE ASC`, async function (err, rows) {
        if (err) reject(err)

        resolve(rows)
      })
    })
  }

  getVoicemailsList () {
    return new Promise((resolve, reject) => {
      var messagedb = this.getDatabase(databases.Voicemail)
      messagedb.all(`SELECT *, datetime(date, 'unixepoch') AS XFORMATTEDDATESTRING from voicemail ORDER BY date ASC`, async function (err, rows) {
        if (err) reject(err)
        resolve(rows)
      })
    })
  }

  getVoicemailFileList () {
    return new Promise((resolve, reject) => {
      var messagedb = this.getDatabase('Manifest.db', true)
      messagedb.all(`SELECT * from FILES where relativePath like 'Library/Voicemail/%.amr'`, async function (err, rows) {
        if (err) reject(err)

        resolve(rows)
      })
    })
  }

  getWifiList () {
    return new Promise((resolve, reject) => {
      var filename = this.getFileName(databases.WiFi)

      try {
        resolve(bplist.parseBuffer(fs.readFileSync(filename))[0])
      } catch (e) {
        reject(e)
      }
    })
  }
}

module.exports.availableBackups = function () {
  const base = path.join(process.env.HOME, '/Library/Application Support/MobileSync/Backup/')
  return new Promise((resolve, reject) => {
    resolve(fs.readdirSync(base, { encoding: 'utf8' })
      .map(file => iPhoneBackup.fromID(file)))
  })
}

module.exports.iPhoneBackup = iPhoneBackup
