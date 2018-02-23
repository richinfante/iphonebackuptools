const json2csv = require('json2csv')


module.exports.format = function (data, options) {
  var data = data.map(el => {
    var row = {}
    
    // Iterate over the columns and add each item to the new row.
    for (var key in options.columns) {
      row[key] = options.columns[key](el)
    }
    
    return row
  })

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
    var outPath = path.join(program.reportOutput, report.name + '.csv')
    console.log('saving', outPath)
    fs.writeFileSync(outPath, report.contents, 'utf8')
  }
}