module.exports.name = 'safari_bookmarks'
module.exports.description = 'List all Safari bookmarks'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

// Specify this only works for iOS 7+
module.exports.supportedVersions = '>=7.0'

// You can also provide an array of functions instead of using `module.exports.func`.
// These functions *should* be independent ranges to ensure reliable execution
module.exports.functions = {
  '>=11.0': function (program, backup, resolve, reject) {
    // This function would be called for iOS 10+
    backup.getSafariBookmarks()
      .then((items) => {
        var result = program.formatter.format(items, {
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
  },
  '>=7.0,<11.0': function (program, backup, resolve, reject) {
    // This function would be called for all iOS 7+.
    backup.getSafariBookmarksiOS7()
      .then((items) => {
        var result = program.formatter.format(items, {
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
}
