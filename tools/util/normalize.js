const stripAnsi = require('strip-ansi')

module.exports = function normalizeOutput (rows, max) {
  function padEnd (string, maxLength, fillString) {
    while (stripAnsi(string).length < maxLength) {
      string = string + fillString
    }

    return string
  }

  var widths = []
  max = max || rows[0].length

  for (let i = 0; i < rows.length; i++) {
    for (let j = 0; j < rows[i].length && j < max; j++) {
      if (!widths[j] || widths[j] < stripAnsi(rows[i][j]).length) {
        widths[j] = stripAnsi(rows[i][j]).length
      }
    }
  }

  for (let i = 0; i < rows.length; i++) {
    for (let j = 0; j < rows[i].length && j < max; j++) {
      if (rows[i][j] === '-') {
        rows[i][j] = padEnd(rows[i][j], widths[j], '-')
      } else {
        rows[i][j] = padEnd(rows[i][j], widths[j], ' ')
      }
    }
  }

  return rows
}
