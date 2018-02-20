const stripAnsi = require('strip-ansi')

function normalizeCols (rows, max) {
  function padEnd (string, maxLength, fillString) {
    while ((stripAnsi(string) + '').length < maxLength) {
      string = string + fillString
    }

    return string
  }

  var widths = []
  max = max || rows[0].length

  for (var i = 0; i < rows.length; i++) {
    for (var j = 0; j < rows[i].length && j < max; j++) {
      if (!widths[j] || widths[j] < (stripAnsi(rows[i][j]) + '').length) {
        widths[j] = (stripAnsi(rows[i][j] + '') + '').length
      }
    }
  }

  for (var i = 0; i < rows.length; i++) {
    for (var j = 0; j < rows[i].length && j < max; j++) {
      if (rows[i][j] == '-') {
        rows[i][j] = padEnd(rows[i][j], widths[j], '-')
      } else {
        rows[i][j] = padEnd(rows[i][j], widths[j], ' ')
      }
    }
  }

  return rows
}

function keyValueArray(columns, keys, obj) {
  return keys.map(el => columns[el](obj))
}

module.exports.format = function (data, options) {
    // Keys for each column
    var keys = []

    // Separators for each column
    var separators = []
    
    // Add to collection of keys
    for(var key in options.columns) {
      keys.push(key)
      separators.push('-')
    }

    // Create the rows
    var items = [
        keys,
        separators,
        ...data.map(data => keyValueArray(options.columns, keys, data))
    ]

    // Normalize column widths.
    items = normalizeCols(items).map(el => {
      return el.join(' | ').replace(/\n/g, '')
    }).join('\n')

    if (!options.color) { items = stripAnsi(items) }

    console.log(items)
    
    return items
}
  