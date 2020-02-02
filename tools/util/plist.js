const fs = require('fs')
const plist = require('plist')
const bplist = require('bplist-parser')

function parseBuffer (buffer) {
  // Binary plists have the marker 'bplist0'
  if (buffer.slice(0, 7).toString('ascii') === 'bplist0') {
    // Parse as binary plist
    data = bplist.parseBuffer(buffer)[0]
  } else {
    // Parse as normal plist
    data = plist.parse(buffer.toString('utf8'))
  }
  return data
}

function parseFile (filePath) {
  return parseBuffer(fs.readFileSync(filePath))
}

module.exports = { parseBuffer, parseFile }
