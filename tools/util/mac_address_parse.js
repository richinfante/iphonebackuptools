
module.exports = {
  pad_zeros: (macAddress) => {
    if (macAddress) {
      return macAddress.split(':')
        .map((hex) => hex.padStart(2, '0'))
        .join(':') 
    }

    return macAddress
  }
}
