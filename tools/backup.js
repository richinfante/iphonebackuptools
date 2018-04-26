const fs = require('fs')
const sqlite3 = require('sqlite3')
const path = require('path')
const log = require('./util/log')
const filehash = require('./util/backup_filehash')

/**
 * Backup3 is the version 4 of the backup library.
 * It focuses on file lookups, and better error handling.
 */
class Backup {
  /**
   * Create a new backup instance.
   * @param {*} base path to backups folder.. Defaults to '~/Library/Application Support/MobileSync/Backup/'
   * @param {*} id directory name of the backup.
   */
  constructor (base, id) {
    log.verbose(`create backup with base=${base}, id=${id}`)
    id = id || ''
    base = base || ''

    // Very wierd, but unwrap from existing backup instance.
    if (id.constructor === Backup) {
      id = id.id
      log.verbose(`unwrapping backup to id=${id}`)
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

  /**
 * Derive a file's ID from it's filename and domain.
 * @param {string} file the path to the file in the domain
 * @param {string=} domain (optional) the file's domain. Default: HomeDomain
 */
  getFileID (path, domain) {
    return Backup.getFileID(path, domain)
  }

  /**
 * Derive a file's ID from it's filename and domain.
 * @param {string} file the path to the file in the domain
 * @param {string=} domain (optional) the file's domain. Default: HomeDomain
 */
  static getFileID (path, domain) {
    return filehash(path, domain)
  }

  /**
   * Get the on-disk filename of a fileID.
   * You shouldn't really ever need to use the isAbsolute flag at all.
   * By default, it searches both possibile paths.
   *
   * @param {*} fileID the file ID. derive using getFileID()
   * @param {boolean=} isAbsoulte (optional) default: false. should we check other file locations?.
   * @throws Throws an error if no file is found
   */
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

      // Check if the path exists
      if (fs.existsSync(path)) {
        log.verbose('trying', path, '[found]')

        // If it does, return it.
        return path
      }
    }

    // Throw an error.
    throw new Error(`Could not find a file needed for this report. It may not be compatibile with this specific backup or iOS Version.`)
  }

  /**
   * Open a database referenced by a fileID
   * It uses getFileName(), so it tries both v2 and v3 paths.
   * @param {string} fileID ihe file id
   * @param {boolean=} isAbsoulte is this an absolute path? default: false.
   * @returns {Promise.<sqlite3.Database>} database instance.
   */
  openDatabase (fileID, isAbsoulte) {
    return new Promise((resolve, reject) => {
      try {
        // Lookup the filename
        let file = this.getFileName(fileID, isAbsoulte)

        // Open as read only
        let db = new sqlite3.Database(file, sqlite3.OPEN_READONLY, (err) => {
          if (err) { return reject(err) }

          if (db != null) {
            resolve(db)
          } else {
            reject(new Error('did not get a database instance.'))
          }
        })
      } catch (e) {
        return reject(e)
      }
    })
  }
}

module.exports = Backup
