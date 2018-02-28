const fs = require('fs')
const log = require('./log')

// Format from here:
// http://www.securitylearn.net/2012/10/27/cookies-binarycookies-reader/

// January 1st, 2001, 00:00:00 UTC
const APPLE_2001_EPOCH = 978307200

function parseCookie (cookieBuff) {
  // Read a null-terminated string from the buffer.
  function readNullTerminatedString (fromIndex) {
    let string = ''

    for (var i = fromIndex; cookieBuff.readInt8(i) !== 0 && i < size; i++) {
      string += String.fromCharCode(cookieBuff.readInt8(i))
    }

    return string
  }

  let size = cookieBuff.readInt32LE(0)
  // 4 unknown bytes
  let flagInt = cookieBuff.readInt32LE(8)
  // 4 unknown bytes
  let urlOffset = cookieBuff.readInt32LE(16)
  let nameOffset = cookieBuff.readInt32LE(20)
  let pathOffset = cookieBuff.readInt32LE(24)
  let valueOffset = cookieBuff.readInt32LE(28)
  // END OF COOKIE 8 bytes = 0x0
  let expirationEpoch = cookieBuff.readDoubleLE(40) + APPLE_2001_EPOCH
  let creationEpoch = cookieBuff.readDoubleLE(48) + APPLE_2001_EPOCH

  // Dictionary of flag strings.
  let flagDict = {
    0: 'none',
    1: 'secure',
    4: 'httpOnly',
    5: 'secure,httpOnly'
  }

  let flags = flagDict[flagInt]
  let url = readNullTerminatedString(urlOffset)
  let name = readNullTerminatedString(nameOffset)
  let path = readNullTerminatedString(pathOffset)
  let value = readNullTerminatedString(valueOffset)
  let expiration = new Date(expirationEpoch * 1000)
  let creation = new Date(creationEpoch * 1000)

  return { url, name, value, path, flags, creation, expiration }
}

function parsePage (page) {
  function checkPageHeader (page) {
    return page.readInt32BE(0) === 0x00000100
  }

  // Header check fails page parse. return nothing.
  if (!checkPageHeader(page)) {
    return []
  }

  // Get the count of cookies on this page.
  const cookieCount = page.readInt32LE(4)

  // Store the cookies.
  let cookies = []

  for (let i = 0; i < cookieCount; i++) {
    // Read offset and size.
    const cookieOffset = page.readInt32LE(8 + i * 4)
    const cookieSize = page.readInt32LE(cookieOffset)

    // Slice buff
    const cookieBuff = page.slice(cookieOffset, cookieOffset + cookieSize)

    // Parse cookie
    let cookie = parseCookie(cookieBuff)

    // Add the cookie if parsing succeded.
    if (cookie) {
      cookies.push(cookie)
    }
  }

  return cookies
}

function parseBase (buff) {
  function checkHeader (buff) {
    return buff.readInt8(0) === 'c'.charCodeAt(0) &&
      buff.readInt8(1) === 'o'.charCodeAt(0) &&
      buff.readInt8(2) === 'o'.charCodeAt(0) &&
      buff.readInt8(3) === 'k'.charCodeAt(0)
  }

  // Header check fails. Return nothing.
  if (!checkHeader(buff)) {
    return []
  }

  let pageCount = buff.readInt32BE(4)
  let dataStart = (pageCount * 4) + 8
  let cursor = dataStart

  let cookies = []

  for (let i = 0; i < pageCount; i++) {
    // Find the page size, and grab the slice from the buffer.
    let pageSize = buff.readInt32BE(8 + i * 4)
    let page = buff.slice(cursor, cursor + pageSize)

    cookies = [...cookies, ...parsePage(page)]

    // Advance the cursor to the next page's tart index.
    cursor += pageSize
  }

  return cookies
}

// This parser works on best-effort, to allow for maximum data retrival.
// If parsing fails, we return nothing, or as much as we can.
// errors are only raised for out-of-bounds errors, etc.
module.exports.parse = function (filePath) {
  return new Promise((resolve, reject) => {

    log.verbose('parse', filePath)

    try {
      let buff = fs.readFileSync(filePath)
      let result = parseBase(buff)
      // console.log(result)
      resolve(result)
    } catch (e) {
      return reject(e)
    }
  })
}
