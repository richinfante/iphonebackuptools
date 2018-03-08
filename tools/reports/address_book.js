module.exports.name = 'address_book'
module.exports.description = 'List all address book records contained in the backup.'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = function (program, backup, resolve, reject) {
  backup.getAddressBook()
    .then((items) => {
    // Use the configured formatter to print the rows.
      const result = program.formatter.format(items, {
      // Color formatting?
        program: program,

        // Columns to be displayed in human-readable printouts.
        // Some formatters, like raw or CSV, ignore these.
        columns: {
          'ID': el => el.ROWID,
          'First': el => el.First ? el.First.substring(0, 10) + '' : '',
          'Last': el => el.Last ? el.Last.substring(0, 10) + '' : '',
          'Organization': el => el.organization ? el.organization.substring(0, 10) + '' : '',
          'Phone Work': el => el.phone_work ? el.phone_work.substring(0, 14) + '' : '',
          'Phone Mobile': el => el.phone_mobile ? el.phone_mobile.substring(0, 14) + '' : '',
          'Phone Home': el => el.phone_home ? el.phone_home.substring(0, 14) + '' : '',
          'Email': el => el.email ? el.email.substring(0, 28) + '' : '',
          'Created Date': el => el.created_date ? el.created_date.substring(0, 28) + '' : '',
          'Note': el => el.note ? el.note.substring(0, 28) + '' : '',
          'Picture': el => el.profile_picture ? 1 : 0
        }
      })

      // If using promises, we must call resolve()
      resolve(result)
    })
    .catch(reject)
}
