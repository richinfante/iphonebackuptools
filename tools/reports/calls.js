module.exports.name = 'calls'
module.exports.description = 'List all call records contained in the backup.'
module.exports.requiresBackup = true
module.exports.functions = {

  //
  // iOS 9+ Call Log Extraction
  //
  '>=9.0': function (program, backup) {
    // File ID for calls is `5a4935c78a5255723f707230a451d79c540d2741`

    backup.queryDatabase('5a4935c78a5255723f707230a451d79c540d2741',
    `
      SELECT *, 
      datetime(ZDATE + 978307200, 'unixepoch') AS XFORMATTEDDATESTRING 
      FROM ZCALLRECORD 
      ORDER BY ZDATE ASC
    `)
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
}
