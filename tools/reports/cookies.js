module.exports.name = 'cookies'
module.exports.description = 'List all iOS cookies'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

// Specify this only works for iOS 10+
module.exports.supportedVersions = '>=10.0'

module.exports.func = function (program, backup, resolve, reject) {
  backup.getCookies()
    .then((items) => {
    // Use the configured formatter to print the rows.
      const result = program.formatter.format(items, {
      // Color formatting?
        program: program,

        // Columns to be displayed in human-readable printouts.
        // Some formatters, like raw or CSV, ignore these.
        columns: {
          'domain': el => el.domain,
          'url': el => el.cookie.url,
          'path': el => el.cookie.name,
          'value': el => el.cookie.value,
          'creation': el => el.cookie.creation,
          'expiration': el => el.cookie.expiration,
          'flags': el => el.cookie.flags
        }
      })

      resolve(result)
    })
    .catch(reject)
}
