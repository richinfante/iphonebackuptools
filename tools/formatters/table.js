const stripAnsi = require('strip-ansi')
const log = require('../util/log')

function keyValueArray (columns, keys, obj) {
  return keys.map(el => {
    if (typeof columns[el] === 'function') {
      return columns[el](obj)
    } else {
      return obj[el]
    }
  })
}

function findMaxLengths (rows) {
  var widths = []

  for (let i = 0; i < rows.length; i++) {
    for (let j = 0; j < rows[i].length; j++) {
      let item = stripAnsi(rows[i][j]) + ''
      if (!widths[j] || widths[j] < item.length) {
        widths[j] = item.length
      }
    }
  }

  return widths
}

function createTable (rows, fitWidth) {
  function padEnd (string, maxLength, fillString) {
    // Don't pad to infinity.
    if (maxLength === Infinity) {
      return string
    }

    // Coerce to string.
    string = string + ''

    // Pad space chars.
    while (stripAnsi(string).length < maxLength) {
      string = string + fillString
    }

    // If the string is too long, substring it.
    if (string.length > maxLength) {
      return string.substr(0, maxLength)
    }

    return string
  }

  // Find target width.
  if (fitWidth > 0) {
    var targetWidth = Math.floor((fitWidth / rows[0].length) - 3)
  } else {
    targetWidth = Infinity
  }

  let maxWidths = findMaxLengths(rows)
  let widths = []

  // Budget for how much more space we can add if needed.
  var budget = 0

  // Calcualte initial column sizes.
  for (let i = 0; i < maxWidths.length; i++) {
    if (maxWidths[i] < targetWidth) {
      budget += (targetWidth - maxWidths[i])
      widths[i] = maxWidths[i]
    } else {
      widths[i] = targetWidth
    }
  }

  if (targetWidth < Infinity) {
    // Add budget until all items can be shown, or we run out of extra space.
    while (budget > 0) {
      var okCount = 0

      for (let i = 0; i < widths.length; i++) {
        let diff = maxWidths[i] - widths[i]

        // If the diff is >0, that means that there may be wrapping.
        if (diff > 0 && budget > 0) {
          // Add extra spaces.
          widths[i] += 1
          budget -= 1
        } else {
          okCount += 1
        }
      }

      // If they all are Ok, end.
      if (okCount === widths.length) {
        break
      }
    }
  }

  // Store the output rows
  var outputRows = []

  // Cursors for each item in the current row.
  var cursors = []

  // Additonal row overflow flag
  let flag = false

  for (let i = 0; i < rows.length; i++) {
    var line = []

    for (let j = 0; j < rows[i].length; j++) {
      cursors[j] = cursors[j] || 0

      // Extract item
      let rawItem = rows[i][j] + ''

      // Slice for this row.
      let inputItem = rawItem.substr(cursors[j], widths[j])

      if (inputItem === '-') {
        line.push(padEnd(inputItem, widths[j], '-'))
      } else {
        // Pad the item and add to the line.
        let item = padEnd(inputItem, widths[j], ' ')
        line.push(item)

        // If the item is too long for one row, flag it to be printed below.
        if (cursors[j] + inputItem.length < rawItem.length && inputItem !== '') {
          flag = true
        }

        // Advance cursor.
        cursors[j] += widths[j]
      }
    }

    // Add line to output rows.
    outputRows.push(line)

    // If the flag is true, we need to repeat the last line.
    if (flag) {
      i -= 1
      flag = false
    } else {
      // Reset cursors.
      cursors = []
    }
  }

  return outputRows
}

module.exports.format = function (data, options) {
  // Keys for each column
  var keys = []

  // Separators for each column
  var separators = []

  // If data is not an array,
  // Turn it into one.
  if (!(data instanceof Array)) {
    data = [data]
  }

  // Ensure we have a column list.
  // If there are no items, grab the keys from the data object.
  if ((!options.columns || Object.keys(options.columns).length === 0) && data.length > 0) {
    options.columns = {}

    for (let item of Object.keys(data[0])) {
      options.columns[item] = true
    }
  }

  // Add to collection of keys
  for (var key in options.columns) {
    keys.push(key)
    separators.push('-')
  }

  // Create the rows
  var items = [
    keys,
    separators,
    ...data.map(data => keyValueArray(options.columns, keys, data))
  ]

  if (options.program && options.program.output !== undefined) {
    var targetWidth = 120
  } else {
    targetWidth = process.stdout.columns
  }

  // Normalize column widths.
  items = createTable(items, targetWidth).map(el => {
    return el.join(' | ').replace(/\n/g, '')
  }).join('\n')

  if (options.program) {
    // Disable color output
    if (!options.program.color) { items = stripAnsi(items) }

    // If reporting output is defined, ignore console log here.
    if (options.program.output === undefined) {
      log.raw(items)
    }
  } else {
    log.raw(items)
  }

  return items
}

const fs = require('fs-extra')
const path = require('path')

module.exports.finalReport = async function (reports, program) {
  if (program.output === undefined) {
    return
  }

  // Ensure the output directory exists.
  fs.ensureDirSync(program.output)

  // Write each report to the disk
  for (var report of reports) {
    var outPath = path.join(program.output, report.name + '.txt')
    log.action('saving', outPath)
    fs.writeFileSync(outPath, report.contents, 'utf8')
  }
}
