const fs = require('fs-extra')
const path = require('path')
const log = require('../util/log')

module.exports.format = function (data, options) {
  var processedData = data.map(el => {
    var row = {}

    // Iterate over the columns and add each item to the new row.
    for (var key in options.columns) {
      row[key] = options.columns[key](el)
    }

    return row
  })

  // Strigify the output, using 2 space indent.
  var output = JSON.stringify(processedData, null, 2)

  if (options.program) {
    // If reporting output is defined, ignore console log here.
    if (options.program.output === undefined) {
      log.raw(output)
    } else {
      return processedData
    }
  } else {
    log.raw(output)
  }

  return processedData
}

module.exports.finalReport = async function (reports, program) {
  if (program.output === undefined) {
    return
  }

  if (program.joinReports) {
    var out = {}

    for (var report of reports) {
      log.action('compiling', report.name)
      out[report.name] = report.contents
    }

    if (program.output === '-') {
      log.raw(JSON.stringify(out, null, 2))
    } else {
      // fs.ensureDirSync(path.dirname(program.output))
      // fs.copySync(sourceFile, outDir)
      let outPath = program.output + '.json'
      log.action('saving', outPath)
      fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8')
    }
  } else {
    fs.ensureDirSync(program.output)

    for (let report of reports) {
      let outPath = path.join(program.output, report.name + '.json')
      log.action('saving', outPath)
      fs.writeFileSync(outPath, JSON.stringify(report.contents, null, 2), 'utf8')
    }
  }
}
