const crypto = require('crypto')

/**
 * Derive a file's ID from it's filename and domain.
 * @deprecated use backup3.js -> getFileID(file, domain) instead.
 *
 * @param {string} file the path to the file in the domain
 * @param {string=} domain (optional) the file's domain. Default: HomeDomain
 */
module.exports = function fileHash (file, domain) {
  domain = domain || 'HomeDomain'
  let shasum = crypto.createHash('sha1')
  shasum.update(`${domain}-${file}`)
  return shasum.digest('hex')
}
