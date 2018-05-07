const path = require('path')
const fs = require('fs-extra')

// Derive filenames based on domain + file path
const fileHash = require('../../util/backup_filehash')
const log = require('../../util/log')

const VOICEMAIL_DB = fileHash('Library/Voicemail/voicemail.db')

module.exports = {
  version: 4,
  name: 'phone.voicemail',
  description: `List all or extract voicemails on device`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
  run (lib, { backup, extract }) {
    return new Promise(async (resolve, reject) => {
      try {
        let voicemails = await getVoicemailsList(backup)

        if (extract) {
          extractVoicemails(voicemails, backup, extract)
        }

        resolve(voicemails)
      } catch (e) {
        reject(e)
      }
    })
  },

  // Manifest fields.
  output: {
    id: el => el.ROWID,
    date: el => el.XFORMATTEDDATESTRING,
    sender: el => el.sender,
    token: el => el.token,
    duration: el => el.duration,
    expiration: el => el.expiration,
    trashed: el => el.trashed_date,
    flags: el => el.flags
  }
}

// Extract a list of voicemails from a backup to a folder on disk.
// - voicemails: list of voicemail data objects.
// - backup: backup api object
// - extractDest: extract location on disk
function extractVoicemails (voicemails, backup, extractDest) {
  for (let voicemail of voicemails) {
    try {
      // Get sender number
      let sender = (voicemail.sender || '').replace(/[ +()-]/g, '')
      var outDir = path.join(extractDest, `voicemail_${sender}_${voicemail.ROWID}.amr`)

      // Get file hash of matching voicemail
      let id = backup.getFileID(`Library/Voicemail/${voicemail.ROWID}.amr`)
      var srcDir = backup.getFileName(id)

      // Log the export
      log.action('extract', srcDir)

      // Ensure output dir exists
      fs.ensureDirSync(path.dirname(outDir))

      // Create a stream to the output.
      fs.createReadStream(srcDir).pipe(fs.createWriteStream(outDir))
    } catch (e) {
      log.error(`Couldn't extract: ${srcDir}`, e)
    }
  }
}

// Get all voicemails from the db.
function getVoicemailsList (backup) {
  return new Promise((resolve, reject) => {
    backup.openDatabase(VOICEMAIL_DB)
      .then(db => {
        db.all(`SELECT *, datetime(date, 'unixepoch') AS XFORMATTEDDATESTRING from voicemail ORDER BY date ASC`, function (err, rows) {
          if (err) reject(err)
          resolve(rows)
        })
      })
      .catch(reject)
  })
}
