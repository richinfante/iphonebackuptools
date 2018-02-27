const fs = require('fs')
const log = require('./log')

function parsePage (page) {
  function checkPageHeader (page) {
    console.log((page.readInt32BE(0) >>> 0).toString(2))
    return page.readInt32BE(0) === 0b00000100
  }

  log.verbose('page header check', checkPageHeader(page))

  // if (!checkPageHeader(page)) {
  //   log.error('page header check failed.')
  // } else {
    const cookieCount = page.readInt32LE(4)
    log.verbose(`${cookieCount} cookies on page`)

    for (var i = 0; i < cookieCount; i++) {
      const pageOffset = page.readInt32LE(8 + i * 4)
      log.verbose(`cookie ${i} offset =`, pageOffset)
      const cookieSize = page.readInt32LE(pageOffset)
      log.verbose(`cookie ${i} size =`, cookieSize)
    }
  // }

  console.log(page)
}

function parseBase (buff) {
  function checkHeader (buff) {
    return buff.readInt8(0) === 'c'.charCodeAt(0) &&
      buff.readInt8(1) === 'o'.charCodeAt(0) &&
      buff.readInt8(2) === 'o'.charCodeAt(0) &&
      buff.readInt8(3) === 'k'.charCodeAt(0)
  }

  // File Header
  log.verbose('header check', checkHeader(buff))

  let pageCount = buff.readInt32BE(4)
  log.verbose('no # pages =', pageCount)

  let dataStart = (pageCount * 4) + 8

  for (let i = 0; i < pageCount; i++) {
    log.action('page', i)
    let pageSize = buff.readInt32BE(8 + i * 4)
    log.verbose(`page ${i} size =`, pageSize)

    let page = buff.slice(dataStart, pageSize)

    parsePage(page)
  }
}

module.exports.parse = function (filePath) {
  return new Promise((resolve, reject) => {
    log.action('parse', filePath)

    try {
      var buff = fs.readFileSync(filePath)
      parseBase(buff)
    } catch (e) {
      console.log(e)
      return reject(e)
    }
  })
}
