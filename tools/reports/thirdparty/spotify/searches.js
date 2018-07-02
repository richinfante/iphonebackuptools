const bplist = require('bplist-parser')
const fs = require('fs')

// Derive filenames based on domain + file path
const fileHash = require('../../../util/backup_filehash')

const database = fileHash('Library/Preferences/com.spotify.client.plist', 'AppDomain-com.spotify.client')


module.exports = {
  version: 4,
  name: 'spotify.searches',
  description: `List associated Spotify account and its usage information`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
    run (lib, { backup }) {
        return spotifyReport(backup)
    },

  // Fields for apps report
  output: {
          'Username': el => el.username,
          'Type': el => el.placeholderIconIdentifier ? el.placeholderIconIdentifier.toLowerCase() : 'song',
          'Title': el => el.title,
          'Subtitle': el => el.subtitle
  }
}

const spotifyReport = (backup) => {
  return new Promise((resolve, reject) => {
    var filename = backup.getFileName(database)
    try {
      let spotifyData = bplist.parseBuffer(fs.readFileSync(filename))[0]
      let spotifyResult = []

      console.log('spotifyData', spotifyData)
      // Get spotify username
      if (Object.keys(spotifyData).some((key) => ~key.indexOf('.com.spotify'))) {
        const keys = Object.keys(spotifyData).filter((key) => ~key.indexOf('.com.spotify'))
        const username = keys[0].split('.com.spotify')[0]
        // Get spotify search history
        const searchHistory = spotifyData[username + '.com.spotify.feature.search.com.spotify.search.fancyRecents']
        searchHistory.forEach(element => {
          element.username = username
        })
        spotifyResult = searchHistory
      }
      resolve(spotifyResult)
    } catch (e) {
      reject(e)
    }
  })
}
