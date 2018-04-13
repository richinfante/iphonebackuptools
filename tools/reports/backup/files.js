const fs = require('fs')
const path = require('path')
const log = require('../../util/log')
const manifestMBDBParse = require('../../util/manifest_mbdb_parse')

module.exports = {
  version: 3,
  name: 'backup.info',
  description: `Gets a backup's info`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
  run (lib, { backup, extract, filter }) {
    return new Promise(async (resolve, reject) => {
      let files = await getManifest(backup)

      // Possibly extract objects.
      if (extract) {
        extractFiles(backup, extract, filter, files)
      }

      resolve(files)
    })
  },

  // Keys to include inside human readable reports.
  // This also gives you an idea of what data is available.
  localizations: {
    'ID': el => el.fileID,
    'Domain': el => el.domain,
    'Path': el => el.filename,
    'Size': el => el.filelen
  }
}

/// Get the manifest for an sqlite database if available
function getSqliteFileManifest (backup) {
  return new Promise(async (resolve, reject) => {
    backup.openDatabase('Manifest.db', true)
      .then(db => {
        db.all('SELECT fileID, domain, relativePath as filename from FILES', async function (err, rows) {
          if (err) reject(err)

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
    (filter && item.domain.indexOf(filter) > -1)
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
      log.action('skipped', item.relativePath)
      continue
    }

    try {
      var sourceFile = backup.getFileName(item.fileID)
      var stat = fs.lstatSync(sourceFile)

      // Only process files that exist.
      if (stat.isFile() && fs.existsSync(sourceFile)) {
        log.action('export', item.relativePath)

        // Calculate the output dir.
        var outDir = path.join(destination, item.domain, item.relativePath)

        // Create the directory and copy
        fs.ensureDirSync(path.dirname(outDir))
        fs.copySync(sourceFile, outDir)

        // Save output info to the data item.
        item.output_dir = outDir
      } else if (stat.isDirectory()) {
      // Do nothing..
      } else {
        log.error('not found', item.relativePath)
      }
    } catch (e) {
      log.error(item.relativePath, e.toString())
    }
  }
}