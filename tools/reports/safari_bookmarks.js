module.exports.name = 'safari_bookmarks'
module.exports.description = 'List all Safari bookmarks'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

// Specify this only works for iOS 9+
module.exports.supportedVersions = '>=9.0'

module.exports.func = function (program, backup, resolve, reject) {
  backup.getSafariBookmarks()
    .then((items) => {
    // Use the configured formatter to print the rows.
      const result = program.formatter.format(items, {
      // Color formatting?
        program: program,

        // Columns to be displayed in human-readable printouts.
        // Some formatters, like raw or CSV, ignore these.
        columns: {
          'id': el => el.id,
          'title': el => el.title ? el.title.trim() : '',
          'url': el => el.url ? el.url.trim() : '',
          'parent': el => el.parent_title
        }
      })

      resolve(result)
    })
    .catch(reject)
}
