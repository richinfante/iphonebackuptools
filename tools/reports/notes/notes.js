const fileHash = require('../../util/backup_filehash')
const log = require('../../util/log')

const NOTES_DB = fileHash('Library/Notes/notes.sqlite')
const NOTES2_DB = fileHash('NoteStore.sqlite', 'AppDomainGroup-group.com.apple.notes')

module.exports = {
  version: 3,
  name: 'notes',
  description: `List all iOS notes`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
  run (lib, { backup }) {
    return getAllNotes(backup)
  },

  // Public facing properties
  output: {
    id: el => el.Z_PK,
    identifier: el => el.ZIDENTIFIER,
    modified: el => (el.XFORMATTEDDATESTRING || el.XFORMATTEDDATESTRING1) + '',
    passwordProtected: el => !!el.ZISPASSWORDPROTECTED,
    title: el => (el.ZTITLE || el.ZTITLE1 || el.ZTITLE2 || '').trim() || null,
    content: el => el.ZCONTENT || null
  }
}

function getAllNotes (backup) {
  return new Promise(async (resolve, reject) => {
    var newNotes

    // Try iOS 10/11 query.
    try {
      newNotes = await getNewNotesiOS10iOS11(backup)
    } catch (e) {
      log.verbose(`couldn't query notes as iOS10/11, trying iOS9`, e)
    }

    // If iOS 10/11 query fails, try iOS 9.
    if (newNotes == null) {
      try {
        newNotes = await getNewNotesiOS9(backup)
      } catch (e) {
        log.verbose(`couldn't query notes as iOS9`, e)
      }
    }

    // Try to fetch old notes database
    try {
      var oldNotes = await getOldNotes(backup)
    } catch (e) {
      log.verbose(`couldn't query old notes`, e)
    }

    // If we didn't get anything successfully, reject.
    if (newNotes == null && oldNotes == null) {
      return reject(new Error(`Couldn't find any known notes database in the system.`))
    }

    // Join the notes together.
    let result = [...(newNotes || []), ...(oldNotes || [])]
    // console.log(result)
    log.verbose(result)

    resolve(result)
  })
}

function getNewNotesiOS9 (backup) {
  return new Promise((resolve, reject) => {
    backup.openDatabase(NOTES2_DB)
      .then(db => {
        db.all(`SELECT ZICCLOUDSYNCINGOBJECT.*, ZICNOTEDATA.ZDATA as X_CONTENT_DATA, datetime(ZCREATIONDATE + 978307200, 'unixepoch') AS XFORMATTEDDATESTRING FROM ZICCLOUDSYNCINGOBJECT LEFT JOIN ZICNOTEDATA ON ZICCLOUDSYNCINGOBJECT.ZNOTE = ZICNOTEDATA.ZNOTE`, async function (err, rows) {
          if (err) reject(err)

          resolve(rows)
        })
      })
      .catch(reject)
  })
}

function getOldNotes (backup) {
  return new Promise((resolve, reject) => {
    backup.openDatabase(NOTES_DB)
      .then(db => {
        db.all(`SELECT *, datetime(ZCREATIONDATE + 978307200, 'unixepoch') AS XFORMATTEDDATESTRING from ZNOTE LEFT JOIN ZNOTEBODY ON ZBODY = ZNOTEBODY.Z_PK`, function (err, rows) {
          if (err) reject(err)
          resolve(rows)
        })
      })
      .catch(reject)
  })
}

function getNewNotesiOS10iOS11 (backup) {
  return new Promise((resolve, reject) => {
    backup.openDatabase(NOTES2_DB)
      .then(db => {
        db.all(`SELECT ZICCLOUDSYNCINGOBJECT.*, ZICNOTEDATA.ZDATA as X_CONTENT_DATA, datetime(ZCREATIONDATE + 978307200, 'unixepoch') AS XFORMATTEDDATESTRING, datetime(ZCREATIONDATE1 + 978307200, 'unixepoch') AS XFORMATTEDDATESTRING1 FROM ZICCLOUDSYNCINGOBJECT LEFT JOIN ZICNOTEDATA ON ZICCLOUDSYNCINGOBJECT.ZNOTE = ZICNOTEDATA.ZNOTE`, function (err, rows) {
          if (err) reject(err)

          resolve(rows)
        })
      })
      .catch(reject)
  })
}
