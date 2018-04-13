const log = require('../../util/log')
const path = require('path')
const sqlite3 = require('sqlite3')
const bplist = require('bplist-parser')
const fs = require('fs')
const plist = require('plist')

// Derive filenames based on domain + file path
const fileHash = require('../../util/backup_filehash')

const database_paired = fileHash('Library/Database/com.apple.MobileBluetooth.ledevices.paired.db', 'SysSharedContainerDomain-systemgroup.com.apple.bluetooth')
const database_other = fileHash('Library/Database/com.apple.MobileBluetooth.ledevices.other.db', 'SysSharedContainerDomain-systemgroup.com.apple.bluetooth')

module.exports.name = 'bluetooth_devices'
module.exports.description = 'List known bluetooth devices'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = function (program, backup, resolve, reject) {
  bluetoothReport(backup)
    .then((items) => {
      var result = program.formatter.format(items, {
        program: program,
        columns: {
          'Name': el => el.Name ? el.Name : 'N/A',
          'Mac Address': el => {
            let address = el.ResolvedAddress ? el.ResolvedAddress : el.Address ? el.Address : 'N/A'
            address = address.indexOf(' ') !== -1 ? address.split(' ')[1] : address
            return address
          },
          'Paired': el => el.Paired ? el.Paired : 'No'
        }
      })
      resolve(result)
    })
    .catch(reject)
}

const bluetoothReport = (backup) => {
  return new Promise((resolve, reject) => {
    var paireddb = backup.getDatabase(database_paired)
    try {
      const query = `
        select * from PairedDevices
        `
      paireddb.all(query, async function (err, rows) {
        if (err) reject(err)
        rows.forEach(row => row.Paired = 'Yes')
        var otherdb = backup.getDatabase(database_other)
        try {
          const query = `
            select * from OtherDevices
            `
          otherdb.all(query, async function (err, rows_other) {
            if (err) reject(err)
            rows_other.forEach(row_other => rows.push(row_other))
            resolve(rows)
          })
        } catch (e) {
          reject(e)
        }
      })
    } catch (e) {
      reject(e)
    }
  })
}
