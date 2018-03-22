const log = require('../util/log')
const path = require('path')
const sqlite3 = require('sqlite3')
const bplist = require('bplist-parser')
const fs = require('fs')
const plist = require('plist')

// Derive filenames based on domain + file path
const fileHash = require('../util/backup_filehash')

const database = fileHash('Library/Preferences/com.spotify.client.plist', 'AppDomain-com.spotify.client')

module.exports.name = 'spotify'
module.exports.description = 'List associated Spotify account and its usage information'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = function (program, backup, resolve, reject) {
  spotifyReport(backup)
    .then((items) => {
      var result = program.formatter.format(items, {
        program: program,
        columns: {
          'Username': el => el.username,
          'Type': el => el.placeholderIconIdentifier ? el.placeholderIconIdentifier.toLowerCase() : 'song',
          'Title': el => el.title,
          'Subtitle': el => el.subtitle
        }
      })
      resolve(result)
    })
    .catch(reject)
}

const spotifyReport = (backup) => {
  return new Promise((resolve, reject) => {
    var filename = backup.getFileName(database)
    try {
      let spotifyData = bplist.parseBuffer(fs.readFileSync(filename))[0]
      let spotifyResult = []
      /*
      wifiList['List of known networks'] = wifiList['List of known networks']
        .map(el => {
          if (el.BSSID) {
            el.BSSID = macParse.pad_zeros(el.BSSID) + ''
          }
          return el
        })*/
      //console.log('spotifyData', spotifyData)
      //Get spotify username
      if (Object.keys(spotifyData).some((key) => ~key.indexOf(".com.spotify"))) {
        const keys = Object.keys(spotifyData).filter((key) => ~key.indexOf(".com.spotify"))
        const username = keys[0].split(".com.spotify")[0]
        //Get spotify search history
        const searchHistory = spotifyData[username + '.com.spotify.feature.search.com.spotify.search.fancyRecents']
        searchHistory.forEach(element => {
          element.username = username
        });
        spotifyResult = searchHistory
      }
      resolve(spotifyResult)
    } catch (e) {
      reject(e)
    }
  })
}