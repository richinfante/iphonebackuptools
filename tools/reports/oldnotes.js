module.exports.name = 'oldnotes'
module.exports.description = 'List all iOS notes (from older unused database)'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = function (program, backup, resolve, reject) {
  backup.getOldNotes(program.dump)
    .then((items) => {
      var result = program.formatter.format(items, {
        program: program,
        columns: {
          'Modified': el => el.XFORMATTEDDATESTRING,
          'ID': el => el.Z_PK,
          'Title': el => (el.ZTITLE + '').substring(0, 128)
        }
      })

      resolve(result)
    })
    .catch(reject)
}
