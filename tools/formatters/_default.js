const fs = require('fs-extra')
const path = require('path')

module.exports.finalReport = async function(reports, program) {
    if (program.reportOutput === undefined) {
      return
    }
    
    // Ensure the output directory exists.
    fs.ensureDirSync(program.reportOutput)

    // Write each report to the disk
    for(var report of reports) {
      console.log('saving report', report.name)
      var outPath = path.join(program.reportOutput, report.name + '.json')
      console.log('writing to', outPath)
      fs.writeFileSync(outPath, JSON.stringify(report.contents), 'utf8')
    }
  }