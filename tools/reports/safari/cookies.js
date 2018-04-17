// Cookie Parser
const cookieParser = require('../../util/cookies.js')

module.exports = {
  version: 4,
  name: 'safari.cookies',
  description: `List all iOS cookies`,
  requiresBackup: true,

  // Run on a v3 lib / backup object
  run (lib, { backup }) {
    return new Promise(async (resolve, reject) => {
      let files = await lib.run('backup.files', { backup, raw: true })

      files = files.filter(el => {
        return el.filename.indexOf('Library/Cookies/Cookies.binarycookies') > -1
      })

      resolve(getCookies(backup, files))
    })
  },

  // Available fields.
  output: {
    domain: el => el.domain,
    url: el => el.cookie.url,
    path: el => el.cookie.name,
    value: el => el.cookie.value,
    creation: el => el.cookie.creation,
    expiration: el => el.cookie.expiration,
    flags: el => el.cookie.flags
  }
}

// Find all the cookies in a set of files in a backup
function getCookies (backup, files) {
  return new Promise(async (resolve, reject) => {
    // Cookies result
    let cookiesResult = []

    const iterateElements = (elements, index, callback) => {
      if (index === elements.length) { return callback() }
      // do parse call with element
      var ele = elements[index]

      cookieParser.parse(backup.getFileName(ele.fileID))
        .then(cookies => {
          // Map to include domain
          let formatted = cookies.map(el => { return { domain: ele.domain, cookie: el } })

          // Append result
          cookiesResult = [...cookiesResult, ...formatted]

          // Next file.
          iterateElements(elements, index + 1, callback)
        })
    }

    iterateElements(files, 0, () => {
      resolve(cookiesResult)
    })
  })
}
