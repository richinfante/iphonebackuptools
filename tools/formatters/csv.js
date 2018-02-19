const json2csv = require('json2csv')


module.exports.format = function (data, options) {
    const csv = json2csv({ data })

    console.log(csv)
}
  