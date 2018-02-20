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

  console.log(output)

  return output
}
