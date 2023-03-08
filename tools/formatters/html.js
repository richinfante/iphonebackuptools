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
    log.verbose('assigning html columns to', options.columns)
  }

  function processRow (el) {
    var row = {}
    // Iterate over the columns and add each item to the new row.
    for (var key of options.columns) {
      if (typeof options.columns[key] === 'function') {
        var val = options.columns[key](el)
      } else {
        var val = el[key]
      }
      if (typeof val === 'object') {
        try {
          val = JSON.stringify(val, null, "  ")
        } catch (e) {
          val = "[Object]"
        }
      }
      row[key] = val
    }
    return row
  }

  const processedData = data.map(processRow)
  const fieldNames = Object.keys(processedData[0])
  const isLongString = (s) => typeof s === 'string' ? s.length > 40 : false;

  const header_row = '<tr class="headerRow">\n' + fieldNames.map(el => `<th><pre>${el}</pre></th>\n`).join('') + '</tr>'
  const body_rows = processedData.map(row => 
    '<tr>\n' + fieldNames.map(key => `<td class="${isLongString(row[key]) ? 'wrap' : ''}"><pre>${row[key]}</pre></td>\n`).join('') + '</tr>'
  )

  const html = `
<html>
<head>
<link href="https://cdn.datatables.net/v/dt/jq-3.6.0/dt-1.13.3/fh-3.3.1/datatables.min.css" rel="stylesheet" integrity="sha256-QlVKqNAdJAtQQXO4Y12ERLKmRO50DnkBQoplePerfmU=" crossorigin="anonymous"/>
<script src="https://cdn.datatables.net/v/dt/jq-3.6.0/dt-1.13.3/fh-3.3.1/datatables.min.js" integrity="sha256-XhMRLNpUV+q0UDfibednt0P7altgCf1aPasm80d+2Jg=" crossorigin="anonymous"></script>
<script>
$(document).ready(() => {
  var searchRow = '<tr class="searchRow">';
  $('#table thead th').each(function(i) {
    const title = $(this).text().trim()
    searchRow += '<th><input type="text" placeholder="filter ' + title + '" data-index="' + i + '" /></th>';
  })
  searchRow += '</tr>'
  $('#table thead').prepend(searchRow)

  const table = $('#table').DataTable({
    dom: 'irt',
    paging: false,
    order: [],
    fixedHeader: true,
  })

  $('table thead input').on('keyup change', function(event) {
    table.column($(this).data('index')).search(this.value).draw()
  })
})
</script>
<style>
.dataTables_info {
  padding: 0.5em 0 0.7em 0 !important;
  float: none !important;
  font-family: monospace;
}
.searchRow th {
  border-top: 1px solid rgba(0, 0, 0, 0.3);
}
.searchRow input {
  width: 100%;
}
.headerRow th {
  border-bottom: 2px solid rgba(0, 0, 0, 0.3);
}
td:last-of-type, th:last-of-type {
  border-right: 1px solid rgba(0, 0, 0, 0.3);
}
td {
  border-top: 1px solid rgba(0, 0, 0, 0.3);
}
th, td {
  padding: 0.5em;
  border-left: 1px solid rgba(0, 0, 0, 0.3);
  text-align: left;
  vertical-align: top;
  max-width: 50em;
  overflow-x: scroll;
  overflow-y: hidden;
  cursor: text;
}
.wrap pre {
  white-space: pre-wrap;
}
tbody tr:nth-child(odd) {
  background-color: whitesmoke !important;
}
</style>
</head>
<body>
<table id="table">
  <thead>
${header_row}
  </thead>
  <tbody>
${body_rows.join('')}
  </tbody>
</table>
</body>
</html>
`

  // Print the output if required.
  if (!options.program || options.program.output === undefined) {
    log.raw(html)
  }

  return html
}

module.exports.finalReport = async function (reports, program) {
  if (program.output === undefined) {
    return
  }

  // Ensure the output directory exists.
  fs.ensureDirSync(program.output)

  // Write each report to the disk
  for (var report of reports) {
    var outPath = path.join(program.output, report.name + '.html')
    log.action('saving', outPath)

    if (program.output === '-') {
      console.log(report.contents)
    } else {
      fs.writeFileSync(outPath, report.contents, 'utf8')
    }
  }
}
