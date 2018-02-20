module.exports.format = function (data, options) {
  var data = data.map(el => {
    var row = {}
    
    // Iterate over the columns and add each item to the new row.
    for (var key in options.columns) {
      row[key] = options.columns[key](el)
    }
    
    return row
  })
  
  // Strigify the output, using 2 space indent.
  var output = JSON.stringify(data, null, 2)
  
  if(options.program) {
    // If reporting output is defined, ignore console log here.
    if (options.program.reportOutput === undefined) {
      console.log(output)
    } else {
      return data
    }
  } else {
    console.log(output)
  }
  
  return data
}

const fs = require('fs-extra')
const path = require('path')

module.exports.finalReport = async function(reports, program) {
  if (program.reportOutput === undefined) {
    return
  }

  if (program.joinReports) {
    var out = {}

    for(var report of reports) {
      console.log('saving report', report.name)
      out[report.name] = report.contents
    }

    if (program.reportOutput == '-') {
      console.log(JSON.stringify(out, null, 2))
    } else {
      // fs.ensureDirSync(path.dirname(program.reportOutput))
      //fs.copySync(sourceFile, outDir)
      var outPath = program.reportOutput + '.json'
      console.log('writing joined to', outPath)
      fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8')
    }
  } else {
    console.log(program.reportOutput)
    fs.ensureDirSync(program.reportOutput)

    for(var report of reports) {
      var outPath = path.join(program.reportOutput, report.name + '.json')
      console.log('saving', outPath)
      fs.writeFileSync(outPath, JSON.stringify(report.contents, null, 2), 'utf8')
    }
  }
}
