const fs = require('fs-extra')
const path = require('path')
const log = require('../../util/log')
const manifestMBDBParse = require('../../util/manifest_mbdb_parse')
const bplist = require('bplist-parser')
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
    mode: el => new Mode(el).toString()
  }
}

/// Get the manifest for an sqlite database if available
function getSqliteFileManifest (backup) {
  return new Promise(async (resolve, reject) => {
    backup.openDatabase('Manifest.db', true)
      .then(db => {
        db.all('SELECT fileID, domain, relativePath as filename, file from FILES', async function (err, rows) {
          if (err) reject(err)

          // Extract binary plist metadata
          for (var row of rows) {
            let data = bplist.parseBuffer(row.file)[0]
            let metadata = data['$objects'][1];
            row.filelen = metadata.Size
            row.mode = metadata.Mode
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
function isIncludedByFilter (filter, item) {
  return filter === 'all' ||
    filter === undefined ||
    (filter && item.domain.indexOf(filter) > -1) ||
    (filter && item.filename.indexOf(filter) > -1)
}

/// Extract files
/// - backup: the backup api object
/// - destination: file system location
/// - filter: contains check filter for files
/// - items: list of files.
function extractFiles (backup, destination, filter, items) {
  for (var item of items) {
    // Filter by the domain.
    // Simple "Contains" Search
    if (!isIncludedByFilter(filter, item)) {
      // Skip to the next iteration of the loop.
      log.action('skipped', item.filename)
      continue
    }

    try {
      let sourceFile = backup.getFileName(item.fileID)
      var stat = fs.lstatSync(sourceFile)

      // Only process files that exist.
      if (stat.isFile() && fs.existsSync(sourceFile)) {
        log.action('export', item.filename)

        // Calculate the output dir.
        var outDir = path.join(destination, item.domain, item.filename)

        // Create the directory and copy
        fs.ensureDirSync(path.dirname(outDir))
        fs.copySync(sourceFile, outDir)

        // Save output info to the data item.
        item.output_dir = outDir
      } else if (stat.isDirectory()) {
      // Do nothing..
      } else {
        log.error('not found', sourceFile)
      }
    } catch (e) {
      log.error(item.fileID, item.filename, e.toString())
    }
  }
}
