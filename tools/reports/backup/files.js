const fs = require('fs-extra')
const path = require('path')
const log = require('../../util/log')
const manifestMBDBParse = require('../../util/manifest_mbdb_parse')
const plist = require('../../util/plist')
const Mode = require('stat-mode');

module.exports = {
  version: 4,
  name: 'backup.files',
  description: `Gets a backup's file list`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
  run (lib, { backup, extract, filter }) {
    return new Promise(async (resolve, reject) => {
      getManifest(backup)
        .then(files => {
          // Possibly extract objects.
          if (extract) {
            extractFiles(backup, extract, filter, files)
          }

          resolve(files)
        })
        .catch(reject)
    })
  },

  // Available fields.
  output: {
    id: el => el.fileID,
    domain: el => el.domain,
    path: el => el.filename,
    size: el => el.filelen || 0,
    mtime: el => el.mtime || 0,
    mode: el => el.mode && new Mode(el).toString()
  }
}

/// Get the manifest for an sqlite database if available
function getSqliteFileManifest (backup) {
  return new Promise(async (resolve, reject) => {
    backup.openDatabase('Manifest.db', true)
      .then(db => {
        db.all('SELECT fileID, domain, relativePath as filename, file from FILES', async function (err, rows) {
          if (err) {
            reject(err)
            return
          }

          // Extract binary plist metadata
          for (var row of rows) {
            if (row.file) {
              let data = plist.parseBuffer(row.file)
              let metadata = data['$objects'][1];
              row.filelen = metadata.Size
              row.mode = metadata.Mode
              row.mtime = row.atime = metadata.LastModified
            }
          }

          resolve(rows)
        })
      })
      .catch(reject)
  })
}

/// Get the manifest from the mbdb file
function getMBDBFileManifest (backup) {
  return new Promise((resolve, reject) => {
    let mbdbPath = backup.getFileName('Manifest.mbdb', true)
    manifestMBDBParse.process(mbdbPath, resolve, reject)
  })
}

/// Try to load both of the manifest files
function getManifest (backup) {
  return new Promise(async (resolve, reject) => {
    // Try the new sqlite file database.
    try {
      log.verbose('Trying sqlite manifest...')
      let item = await getSqliteFileManifest(backup)
      return resolve(item)
    } catch (e) {
      log.verbose('Trying sqlite manifest... [failed]', e)
    }

    // Try the mbdb file database
    try {
      log.verbose('Trying mbdb manifest...')
      let item = await getMBDBFileManifest(backup)
      return resolve(item)
    } catch (e) {
      log.verbose('Trying mbdb manifest...[failed]', e)
    }

    reject(new Error('Could not find a manifest.'))
  })
}

/// Filter exclusion check
function isIncludedByFilter (filter, item, filePath) {
  if (filter === 'all' || filter === undefined)
    return true;

  for (var f of Array.isArray(filter) ? filter : [filter]) {
    if (!isIncludedBySingleFilter(f, item, filePath))
      return false;
  }
  return true;
}

function isIncludedBySingleFilter (filter, item, filePath) {
  for (var x of [item.domain, item.filename, filePath]) {
    if (isIncludedBySingleFilterCheck(filter, x))
      return true;
  }
}

function isIncludedBySingleFilterCheck (filter, x) {
  if (filter instanceof RegExp)
    return x.search(filter) > -1
  else if (filter instanceof Function)
    return filter(x)
  else
    return x.indexOf(filter) > -1;
}

/// Extract files
/// - backup: the backup api object
/// - destination: file system location
/// - filter: contains check filter for files
/// - items: list of files.
function extractFiles (backup, destination, filter, items) {
  for (var item of items) {
    try {
      if (!item.domain || !item.filename) {
        log.warning(`skipping fileID ${item.fileID} without domain or path`)
        continue
      }

      var domainPath = item.domain
      if (domainPath.match(/^AppDomain.*-/)) {
        // Extract sub-domain from app domain
        domainPath = domainPath.replace('-', path.sep)
      }

      domainPath = domainPath.replace('Domain', '')

      var filePath = path.join(domainPath, item.filename)

      // Skip items not included by the filter
      if (!isIncludedByFilter(filter, item, filePath)) {
        // Skip to the next iteration of the loop.
        log.action('skipped', filePath)
        continue
      }

      var stat = new Mode(item)

      if (stat.isSymbolicLink()) {
        log.warning('skipping symlink', filePath, 'to', item.linktarget)
        // FIXME: Restore symlinks
        continue
      }

      // Calculate the output path
      var outPath = path.join(destination, filePath)

      if (stat.isDirectory()) {
        log.action('mkdir', filePath)
        fs.ensureDirSync(outPath)
      } else if (stat.isFile()) {
        let sourceFile = backup.getFileName(item.fileID)

        // Only process files that exist.
        if (fs.existsSync(sourceFile)) {
          log.action('export', filePath)
          fs.copySync(sourceFile, outPath)
          fs.utimesSync(outPath, item.atime, item.mtime)
        } else {
          log.error('not found', sourceFile)
        }
      } else {
        throw new Error('unknown filetype')
      }

      // Save output info to the data item.
      item.output_dir = outPath

    } catch (e) {
      log.error(item.fileID, item.filename, e.toString())
    }
  }
}
