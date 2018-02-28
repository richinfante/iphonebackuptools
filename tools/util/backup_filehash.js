const crypto = require('crypto')

/// Derive the name of the file inside of the backup from it's domain and file name.
module.exports = function fileHash (file, domain) {
  domain = domain || 'HomeDomain'
  let shasum = crypto.createHash('sha1')
  shasum.update(`${domain}-${file}`)
  return shasum.digest('hex')
}
