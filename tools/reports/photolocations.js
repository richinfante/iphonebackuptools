module.exports.name = 'photolocations'
module.exports.description = 'List all geolocation information for iOS photos (iOS 10+)'

// Specify this reporter requires a backup. 
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this only works for iOS 10+
module.exports.supportedVersions = '>=10.0'

// Reporting function
module.exports.func = function (program, backup) {
  backup.getPhotoLocationHistory()
    .then((history) => {
      // Format the output according to the configured formatter.
      program.formatter.format(history, {
        color: program.color,
        columns: {
          'Time': el => el.XFORMATTEDDATESTRING,
          'Latitude': el => el.ZLATITUDE,
          'Longitude': el => el.ZLONGITUDE,
          'File': el => el.ZFILENAME,
        }
      })
    })
    .catch((e) => {
      console.log('[!] Encountered an Error:', e)
    })
}