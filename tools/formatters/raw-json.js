const log = require('../util/log')

module.exports.isRaw = true

module.exports.format = function (data, options) {
  var output = JSON.stringify(data)

  if (options.program) {
    // If reporting output is defined, ignore console log here.
    if (options.program.output === undefined) {
      log.raw(output)
    } else {
      return data
    }
  } else {
    log.raw(output)
  }

  return data
}

const fs = require('fs-extra')
const path = require('path')

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
      log.action('compiling', outPath)
      fs.writeFileSync(outPath, JSON.stringify(out), 'utf8')
    }
  } else {
    // Ensure the output directory exists.
    fs.ensureDirSync(program.output)

    // Write each report to the disk
    for (let report of reports) {
      let outPath = path.join(program.output, report.name + '.json')
      log.action('saving', outPath)

      if (program.output === '-') {
        console.log(JSON.stringify(report.contents))
      } else {
        fs.writeFileSync(outPath, JSON.stringify(report.contents), 'utf8')
      }
    }
  }
}
