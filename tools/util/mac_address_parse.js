const zpad = require('zpad')

module.exports = {
  pad_zeros: (macAddress) => {
    if (macAddress) { return macAddress.split(':').map((hex) => zpad(hex)).join(':') }
    return macAddress
  }
}
