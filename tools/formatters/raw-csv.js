const json2csv = require('json2csv')
const log = require('../util/log')

const fs = require('fs-extra')
const path = require('path')

module.exports = {

  // This report wants raw data.
  isRaw: true,

  format (data, options) {
    const csv = json2csv({ data })

    if (options.program) {
      // If reporting output is defined, ignore console log here.
      if (options.program.output === undefined) {
        log.raw(csv)
      }
    } else {
      log.raw(csv)
    }

    return csv
  },

  finalReport (reports, program) {
    if (program.output === undefined) {
      return
    }

    // Ensure the output directory exists.
    fs.ensureDirSync(program.output)

    // Write each report to the disk
    for (var report of reports) {
      var outPath = path.join(program.output, report.name + '.csv')
      log.action('saving', outPath)

      if (program.output === '-') {
        console.log(JSON.stringify(report.contents))
      } else {
        fs.writeFileSync(outPath, report.contents, 'utf8')
      }
    }
  }
}
