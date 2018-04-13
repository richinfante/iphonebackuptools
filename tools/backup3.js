const fs = require('fs')
const sqlite3 = require('sqlite3')
const path = require('path')
const log = require('./util/log')
const filehash = require('./util/backup_filehash')

// Version 3 backup API, just contains information about and utils for files.
class Backup3 {
  constructor (base, id) {
    id = id || ''
    base = base || ''

    // Very wierd, but unwrap from existing backup instance.
    if (id.constructor.name === 'Backup3') {
      id = id.id
    }

    this.id = id
    this.base = base

    // Get the path of the folder.
    if (base) {
      this.path = path.join(base, id)
    } else {
      this.path = path.join(process.env.HOME, '/Library/Application Support/MobileSync/Backup/', id)
    }
  }

  getFileID (path, domain) {
    return filehash(path, domain)
  }

  getFileName (fileID, isAbsoulte) {
    // Default to non-absolute paths.
    isAbsoulte = isAbsoulte || false

    // Possible file locations for an ID
    let possibilities

    if (isAbsoulte) {
      // We must only check in the root folder of the backup.
      possibilities = [
        path.join(this.path, fileID)
      ]
    } else {
      // Check in both /abcdefghi and /ab/abcdefghi
      possibilities = [
        path.join(this.path, fileID),
        path.join(this.path, fileID.substr(0, 2), fileID)
      ]
    }

    // Return first path that works.
    for (let path of possibilities) {
      log.verbose('trying', path, fs.existsSync(path))
      if (fs.existsSync(path)) {
        log.verbose('trying', path, '[found]')
        return path
      }
    }

    throw new Error(`Could not find a file needed for this report. It may not be compatibile with this specific backup or iOS Version.`)
  }

  /// Open a database that may be in the backup.
  /// It uses getFileName(), so it tries both v2 and v3 paths.
  /// Returns a promise.
  openDatabase (fileID, isAbsoulte) {
    return new Promise((resolve, reject) => {
      try {
        let file = this.getFileName(fileID)

        let db = new sqlite3.Database(file, sqlite3.OPEN_READONLY, (err) => {
          if (err) { return reject(err) }

          if (db != null) {
            resolve(db)
          }
        })
      } catch (e) {
        return reject(e)
      }
    })
  }
}

module.exports = Backup3
