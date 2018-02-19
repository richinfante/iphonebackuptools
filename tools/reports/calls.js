module.exports.name = 'calls'
module.exports.description = 'List all call records contained in the backup.'

// Specify this reporter requires a backup. 
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this only works for iOS 10+
module.exports.supportedVersions = '>=10.0'

module.exports.func = function (program, backup) {

  backup.getCallsList()
  .then((items) => {
    // Use the configured formatter to print the rows.
    program.formatter.format(items, {
      // Color formatting?
      color: program.color,

      // Columns to be displayed in human-readable printouts.
      // Some formatters, like raw or CSV, ignore these.
      columns: {
        'ID': el => el.Z_PK,
        'Date': el => el.XFORMATTEDDATESTRING,
        'Answered': el => el.ZANSWERED + '',
        'Originated': el => el.ZORIGINATED + '',
        'Call Type': el => el.ZCALLTYPE + '',
        'Duration': el => el.ZDURATION + '',
        'Location': el => el.ZLOCATION + '',
        'Country': el => el.ZISO_COUNTRY_CODE + '',
        'Service': el => el.ZSERVICE_PROVIDER + '',
        'Address': el => (el.ZADDRESS || '').toString()
      }
    })
  })
  .catch((e) => {
    console.log('[!] Encountered an Error:', e)
  })
}
