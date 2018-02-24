// First, give it a name!
module.exports.name = 'example module'

// Provide a description.
module.exports.description = 'An example module to show how it works'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
// Most reporting types should use this.
module.exports.requiresBackup = true

// Should this report be skipped in automated reports?
// This is used when the 'all' report type is specified, and all possible reports are generated.
// with this set to true, the report WILL NOT run when report type = 'all'
// Most reporting types shouldn't need this.
module.exports.requiresInteractivity = true

// Specify this reporter supports the promises API for allowing chaining of reports.
// All modules should use this.
module.exports.usesPromises = true

// Specify this only works for iOS 10+
// If it is iOS-version specific, you can specify version information here.
// You may provide a comma separated string such as ">=6.0,<11.0" to indicate ranges.
module.exports.supportedVersions = '>=10.0'

// Most reports will use this pattern.
// Reporting function (for usesPromises = true)
module.exports.func = function (program, backup, resolve, reject) {
  // This function will be called with the `commander` program, and the iPhoneBackup instance as arguments
  // It MUST resolve() the final result, or reject() if there's an error

  // First, fetch some data. This variable should be an array of objects representing each row in a report.
  // This would be replaced with a function from the backup object.
  let data = backup.getData()

  // Next, pass it to the user-selected formatter.
  var result = program.formatter.format(data, {
    // Provide the program options
    program: program,

    // A dictionary of items to be displayed as formatted data.
    // The key is the column name, the value is a function that returns the value given an object representing a row.
    columns: {
      'Column-Name': row => row.ROWID
    }
  })

  // Resolve the promise with the result.
  // This ensures proper file output and multi-reporting.
  resolve(result)
}

// --- OR ---

// You can also provide an array of functions instead of using `module.exports.func`.
// These functions *should* be independent ranges to ensure reliable execution.
module.exports.functions = {
  '>=10.0': function (program, backup, resolve, reject) {
    // This function would be called for iOS 10+.
    // format and resolve() in the same manner as the example above.

  },
  '>=9.0,<10.0': function (program, backup) {
    // This function would be called for all iOS 9.
    // format and resolve() in the same manner as the example above.
  }
}
