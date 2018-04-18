const json2csv = require('json2csv')
const fs = require('fs-extra')
const path = require('path')
const log = require('../util/log')

module.exports.format = function (data, options) {
  // Default columns to an empty object
  options.colums = options.columns || {}

  // Check if the array is empty. If so, return an empty string.
  if (data instanceof Array && data.length === 0) {
    return ''
  }

  // If we didn't get a data object, make it an array for ease of use.
  if (!(data instanceof Array) && typeof data === 'object') {
    data = [data]
  }

  // Do some preprocessing to find the columns.
  if ((!options.columns || Object.keys(options.colums).length === 0) && data.length > 0) {
    // Extract the fields from the first object.
    options.columns = Object.keys(data[0])
  }

  function processRow (el) {
    var row = {}

    // Iterate over the columns and add each item to the new row.
    for (var key in options.columns) {
      if (typeof options.colums[key] === 'function') {
        row[key] = options.columns[key](el)
      } else {
        row[key] = el[key]
      }
    }

    return row
  }

  var processedData = data.map(processRow)

  const csv = json2csv({ data: processedData, fieldNames: Object.keys(data[0]) })

  // Print the output if required.
  if (!options.program || options.program.output === undefined) {
    log.raw(csv)
  }

  return csv
}

module.exports.finalReport = async function (reports, program) {
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
      console.log(report.contents)
    } else {
      fs.writeFileSync(outPath, report.contents, 'utf8')
    }
  }
}
