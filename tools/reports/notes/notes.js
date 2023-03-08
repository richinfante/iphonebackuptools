const fs = require('fs')
const path = require('path')
const zlib = require('zlib')
const Pbf = require('pbf')
const fileHash = require('../../util/backup_filehash')
const log = require('../../util/log')
const apple_timestamp = require('../../util/apple_timestamp')

const NOTES_DB = fileHash('Library/Notes/notes.sqlite')
const NOTES2_DB = fileHash('NoteStore.sqlite', 'AppDomainGroup-group.com.apple.notes')

module.exports = {
  version: 4,
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
    created: el => el.X_FORMATTED_ZCREATIONDATE + '',
    modified: el => el.X_FORMATTED_ZMODIFICATIONDATE + '',
    passwordProtected: el => !!el.ZISPASSWORDPROTECTED,
    title: el => (el.ZTITLE || el.ZTITLE1 || el.ZTITLE2 || '').trim() || null,
    content: el => el.ZCONTENT || el.X_PBF_NOTE_TEXT || null
  }
}

function getAllNotes (backup) {
  return new Promise(async (resolve, reject) => {
    var newNotes

    // Try iOS 14 query.
    try {
      newNotes = await getNewNotesiOS14(backup)
    } catch (e) {
      log.verbose(`couldn't query notes as iOS14, trying iOS10/11`, e)
    }

    // If iOS 14 query fails, try iOS 10/11.
    if (newNotes == null) {
      try {
        newNotes = await getNewNotesiOS10iOS11(backup)
      } catch (e) {
        log.verbose(`couldn't query notes as iOS10/11 trying iOS9`, e)
      }
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

function getOldNotes (backup) {
  return new Promise((resolve, reject) => {
    backup.openDatabase(NOTES_DB)
      .then(db => {
        db.all(`SELECT *, ${apple_timestamp.parse('ZCREATIONDATE')} AS X_FORMATTED_ZCREATIONDATE, ${apple_timestamp.parse('ZMODIFICATIONDATE')} AS X_FORMATTED_ZMODIFICATIONDATE from ZNOTE LEFT JOIN ZNOTEBODY ON ZBODY = ZNOTEBODY.Z_PK`, function (err, rows) {
          if (err) {
            reject(err)
          } else {
            resolve(rows)
          }
        })
      })
      .catch(reject)
  })
}


var NoteStoreProto = null;

function decodeProtobufData (zdata) {
  if (!NoteStoreProto) {
    const compile = require('pbf/compile')
    const schema = require('protocol-buffers-schema')
    const proto = schema.parse(fs.readFileSync(path.resolve(__dirname, 'notestore.proto')))
    NoteStoreProto = compile(proto).NoteStoreProto;
  }

  var note_text = null
  if (zdata) {
    const decompressed = zlib.gunzipSync(zdata)
    if (decompressed) {
      const noteData = NoteStoreProto.read(new Pbf(decompressed))
      note_text = noteData.document.note.note_text
    }
  }
  return note_text
}


function getNewNotes (backup, creationDateField, modificationDateField) {
  return new Promise((resolve, reject) => {
    backup.openDatabase(NOTES2_DB)
      .then(db => {
        db.all(`
SELECT ZICCLOUDSYNCINGOBJECT.*,
ZICNOTEDATA.ZDATA as X_CONTENT_DATA,
${apple_timestamp.parse(creationDateField)} AS X_FORMATTED_ZCREATIONDATE,
${apple_timestamp.parse(modificationDateField)} AS X_FORMATTED_ZMODIFICATIONDATE
FROM ZICCLOUDSYNCINGOBJECT
LEFT JOIN ZICNOTEDATA ON ZICCLOUDSYNCINGOBJECT.Z_PK = ZICNOTEDATA.ZNOTE
`, async function (err, rows) {
          if (err) {
            reject(err)
          } else {
            rows.forEach(row => {
              row.X_PBF_NOTE_TEXT = decodeProtobufData(row.X_CONTENT_DATA)
            })
            resolve(rows)
          }
        })
      })
      .catch(reject)
  })
}

function getNewNotesiOS9 (backup) {
  return getNewNotes(backup, 'ZCREATIONDATE', 'ZMODIFICATIONDATE')
}

function getNewNotesiOS10iOS11 (backup) {
  return getNewNotes(backup, 'ZCREATIONDATE1', 'ZMODIFICATIONDATE1')
}

function getNewNotesiOS14 (backup) {
  return getNewNotes(backup, 'ZCREATIONDATE3', 'ZMODIFICATIONDATE1')
}
