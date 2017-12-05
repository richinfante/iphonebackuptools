const path = require('path')
const sqlite3 = require('sqlite3')
const bplist = require('bplist-parser')
const fs = require('fs')
const plist = require('plist')
const tz_offset = 5;

const databases = {
  SMS: '3d0d7e5fb2ce288813306e4d4636395e047a3d28',
  Contacts: '31bb7ba8914766d4ba40d6dfb6113c8b614be442',
  Calendar: '2041457d5fe04d39d0ab481178355df6781e6858',
  Reminders: '2041457d5fe04d39d0ab481178355df6781e6858',
  Notes: 'ca3bc056d4da0bbf88b5fb3be254f3b7147e639c',
  Calls: '2b2b0084a1bc3a5ac8c27afdf14afb42c61a19ca',
  Locations: '4096c9ec676f2847dc283405900e284a7c815836',
  WebHistory: 'e74113c185fd8297e140cfcf9c99436c5cc06b57',
  Photos: '12b144c0bd44f2b3dffd9186d3f9c05b917cee25'
}

var cache = {}

class iPhoneBackup {
  constructor(id, status, info, manifest) {
    this.id = id;
    this.status = status;
    this.info = info;
    this.manifest = manifest;
  }

  // Open a backup with a specified ID
  // base is optional and will be computed if not used.
  static fromID(id, base) {
    // Get the path of the folder.
    if(base) {
      base = path.join(base, id)
    } else {
      base = path.join(process.env.HOME, '/Library/Application Support/MobileSync/Backup/', id)
    }

    // Parse manifest bplist files
    try {
      var status = bplist.parseBuffer(fs.readFileSync(path.join(base, 'Status.plist')))[0];
    } catch (e) {
      console.log('Cannot open Status.plist', e)
    }
    try {
      var manifest = bplist.parseBuffer(fs.readFileSync(path.join(base, 'Manifest.plist')))[0];
    } catch (e) {
      console.log('Cannot open Manifest.plist', e)
    }
    try {
      var info = plist.parse(fs.readFileSync(path.join(base, 'Info.plist'), 'utf8'));
    } catch (e) {
      console.log('Cannot open Info.plist', e)
    }

    return new iPhoneBackup(id, status, info, manifest)
  }

  getDatabase(fileID, isAbsoulte) {
    isAbsoulte = isAbsoulte || false

    // Get the backup folder
    const base = path.join(process.env.HOME, '/Library/Application Support/MobileSync/Backup/', this.id)
    // Return v2 filename
    if (this.status.Version < 3 || isAbsoulte) {
      return new sqlite3.Database(path.join(base, fileID), sqlite3.OPEN_READONLY)
    } else {
      // v3 has folders
      return new sqlite3.Database(path.join(base, fileID.substr(0, 2), fileID), sqlite3.OPEN_READONLY)
    }
  }

  getName(messageDest) {
    
    return new Promise((resolve, reject) => {
      if(messageDest.indexOf('@') === -1) {
        messageDest = messageDest.replace(/[\s+\-()]*/g, '')
        if(messageDest.length == 11 && messageDest[0] == '1') {
          messageDest = messageDest.substring(1)
        }
      }

      if(cache[messageDest] !== undefined) {
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
          if(err) return resolve()
          if(!row) return resolve()

          var result = {
          name: [row.first, row.middle, row.last].filter(el => el != null).join(' '),
          phones: row.phones.split(' '),
          query: messageDest
        }

        if(row) cache[messageDest] = result

        resolve(result)
      })
    })
  }

  getMessages(chat_id, dumpAll) {
    var backup = this;
    return new Promise((resolve, reject) => {
      var messagedb = this.getDatabase(databases.SMS)
      
      messagedb.all(`
        SELECT 
          message.*,
          handle.id as sender_name
        FROM chat_message_join 
        INNER JOIN message 
          ON message.rowid = chat_message_join.message_id 
        INNER JOIN handle
          ON handle.rowid = message.handle_id
        WHERE chat_message_join.chat_id = ?`, [parseInt(chat_id)], 
     async function (err, chats) {
      if(err) return reject(err)

       chats = chats || []
        var offset = new Date('2001-01-01 00:00:00').getTime()
        
        if(dumpAll) console.log(JSON.stringify(chats, null, 4))

        for(var i in chats) {
          var el = chats[i]
          
          // Some of the dates are of much larger precision
          if(el.date > 100000000000000000) {
            el.date = el.date / 1000000000
          }

          var date = new Date(offset + el.date * 1000 - tz_offset * 60 * 60 * 1000)
          var text = el.text
          var sender = el.is_from_me ? 'Me' : el.sender_name

          if(!el.is_from_me) {
            var contact = await backup.getName(el.sender_name)

            if(contact) {
              sender = `${contact.name} <${contact.query}>`
            }
          }

          chats[i] = { sender, text, date }
        }

        

        resolve(chats)
      })
    })
  }

  getConversations(dumpAll) {
    var backup = this
    return new Promise((resolve, reject) => {
      var messagedb = this.getDatabase(databases.SMS)

      messagedb.all('SELECT * FROM chat', async function (err, rows) {
        if(err) return reject(err)
        rows = rows || []

        for(var el of rows) {
          if (el.properties) el.properties = bplist.parseBuffer(el.properties)[0]


          // Interestingly, some of these do not have dates attached.
          if (el.properties) {
            el.date = new Date(el.properties.CKChatWatermarkTime * 1000)
          } else {
            el.date = new Date(0)
          }

          var contact = await backup.getName(el.chat_identifier)

          if(contact) {
            el.display_name = `${contact.name} <${contact.query}>`
          }
        }

        rows = rows.sort(function (a, b) {
          // Turn your strings into dates, and then subtract them
          // to get a value that is either negative, positive, or zero.
          return new Date(b.date) - new Date(a.date);
        });

        if(dumpAll) console.log(JSON.stringify(rows, null, 4))

        resolve(rows)
      })
    })
  }

  getFileManifest() {
    return new Promise((resolve, reject) => {
      var messagedb = this.getDatabase('Manifest.db', true)
      messagedb.all('SELECT * from FILES', async function (err, rows) {
        if (err) reject(err)

        resolve(rows)
      })
    
    })
  }

  getNotes() {
    return new Promise((resolve, reject) => {
      var messagedb = this.getDatabase(databases.Notes)
      messagedb.all('SELECT * from ZNOTE LEFT JOIN ZNOTEBODY ON ZBODY = ZNOTEBODY.Z_PK', async function (err, rows) {
        if (err) reject(err)
        
        resolve(rows)
      })
    
    })
  }

  getWebHistory() {
    return new Promise((resolve, reject) => {
      var messagedb = this.getDatabase(databases.WebHistory)
      messagedb.all('SELECT * from history_visits LEFT JOIN history_items ON history_items.ROWID = history_visits.history_item', async function (err, rows) {
        if(err) reject(err)

        resolve(rows)
      })
    
    })
  }

  getPhotoLocationHistory() {
    return new Promise((resolve, reject) => {
      var messagedb = this.getDatabase(databases.Photos)
      messagedb.all('SELECT ZDATECREATED, ZLATITUDE, ZLONGITUDE, ZFILENAME FROM ZGENERICASSET ORDER BY ZDATECREATED ASC', async function (err, rows) {
        if(err) reject(err)

        resolve(rows)
      })
    
    })
  }
}



module.exports.availableBackups = function () {
  const base = path.join(process.env.HOME, '/Library/Application Support/MobileSync/Backup/')
  return new Promise((resolve, reject) => {
    resolve(fs.readdirSync(base, { encoding: 'utf8' })
      .filter(el => el.length == 40)
      .map(file => iPhoneBackup.fromID(file)))
  })
}

module.exports.iPhoneBackup = iPhoneBackup