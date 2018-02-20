const json2csv = require('json2csv')


module.exports.format = function (data, options) {
  const csv = json2csv({ data })
  
  
  if(options.program) {
    // If reporting output is defined, ignore console log here.
    if (options.program.reportOutput === undefined) {
      console.log(csv)
    }
  } else {
    console.log(csv)
  }
  
  
  return csv
}

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
    var outPath = path.join(program.reportOutput, report.name + '.csv')
    console.log('writing to', outPath)
    fs.writeFileSync(outPath, report.contents, 'utf8')
  }
}