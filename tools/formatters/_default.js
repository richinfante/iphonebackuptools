const fs = require('fs-extra')
const path = require('path')
const log = require('../util/log')

module.exports.finalReport = async function (reports, program) {
  if (program.output === undefined) {
    return
  }

  // Ensure the output directory exists.
  fs.ensureDirSync(program.output)

  // Write each report to the disk
  for (var report of reports) {
    var outPath = path.join(program.output, report.name + '.json')
    log.action('saving', outPath)
    fs.writeFileSync(outPath, JSON.stringify(report.contents), 'utf8')
  }
}
