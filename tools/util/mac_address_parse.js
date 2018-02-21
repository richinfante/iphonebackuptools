const zpad = require('zpad')

module.exports = {
  pad_zeros: (mac_address) => {
    if (mac_address)
      return mac_address.split(':').map((hex) => zpad(hex)).join(':')
    return mac_address
  }
}