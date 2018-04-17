const fileHash = require('../../util/backup_filehash')
const log = require('../../util/log')

const BOOKMARKS_DB = fileHash('Library/Safari/Bookmarks.db')

module.exports = {
  version: 4,
  name: 'safari.bookmarks',
  description: `List all Safari bookmarks`,
  requiresBackup: true,

  // Run on a v3 lib / backup object
  run (lib, { backup }) {
    return getAllBookmarks(backup)
  },

  // Available fields.
  output: {
    id: el => el.id,
    title: el => el.title ? el.title.trim() : '',
    url: el => el.url ? el.url.trim() : '',
    parent: el => el.parent_title
  }
}

function getAllBookmarks (backup) {
  return new Promise(async (resolve, reject) => {
    // Try to run newer version. If it fails, try older.
    try {
      let iOSBookmarks = await getSafariBookmarksLater(backup)
      return resolve(iOSBookmarks)
    } catch (e) {
      log.verbose(`Couldn't load iOS7+ bookmarks`, e)
    }

    // Run older.
    try {
      let iOS7Bookmarks = await getSafariBookmarksiOS7(backup)
      return resolve(iOS7Bookmarks)
    } catch (e) {
      log.verbose(`Couldn't load iOS7+ bookmarks`, e)
    }

    // Fail
    reject(new Error('Could not find any bookmarks. Use -v to see error info.'))
  })
}

// Get iOS Bookmarks for newer versions
function getSafariBookmarksLater (backup) {
  return new Promise((resolve, reject) => {
    backup.openDatabase(BOOKMARKS_DB)
      .then(db => {
        const query = `
        select bookmarks.id
          , bookmarks.title
          , bookmarks.url
          , bookmarks.parent as parent_id
          , bookmarks.special_id
          , bookmarks.type
          , bookmarks.num_children
          , bookmarks.editable
          , bookmarks.deletable
          , bookmarks.hidden
          , bookmarks.hidden_ancestor_count
          , bookmarks.order_index
          , bookmarks.external_uuid
          , bookmarks.read
          , bookmarks.last_modified
          , bookmarks.server_id
          , bookmarks.sync_key
          , bookmarks.added
          , bookmarks.deleted
          , bookmarks.fetched_icon
          , bookmarks.dav_generation
          , bookmarks.locally_added
          , bookmarks.archive_status
          , bookmarks.syncable
          , bookmarks.web_filter_status
          , bookmarks.modified_attributes
          , parent_bookmarks.title as parent_title
        from bookmarks
        left join bookmarks as parent_bookmarks on parent_bookmarks.id = bookmarks.parent
        where bookmarks.type = 0
        order by bookmarks.id
      `
        db.all(query, async function (err, rows) {
          if (err) reject(err)

          resolve(rows)
        })
      })
      .catch(reject)
  })
}

// Run older bookmark report
function getSafariBookmarksiOS7 (backup) {
  return new Promise((resolve, reject) => {
    backup.openDatabase(BOOKMARKS_DB)
      .then(db => {
        const query = `
        select bookmarks.id
          , bookmarks.special_id
          , bookmarks.parent as parent_id
          , bookmarks.type
          , bookmarks.title
          , bookmarks.url
          , bookmarks.num_children
          , bookmarks.editable
          , bookmarks.deletable
          , bookmarks.hidden
          , bookmarks.hidden_ancestor_count
          , bookmarks.order_index
          , bookmarks.external_uuid
          , bookmarks.read
          , bookmarks.last_modified
          , bookmarks.server_id
          , bookmarks.sync_key
          , bookmarks.sync_data
          , bookmarks.added
          , bookmarks.deleted
          , bookmarks.extra_attributes
          , bookmarks.local_attributes
          , bookmarks.fetched_icon
          , bookmarks.icon
          , bookmarks.dav_generation
          , bookmarks.locally_added
          , bookmarks.archive_status
          , bookmarks.syncable
          , bookmarks.web_filter_status
          , parent_bookmarks.title as parent_title
        from bookmarks
        left join bookmarks as parent_bookmarks on parent_bookmarks.id = bookmarks.parent
        where bookmarks.type = 0
        order by bookmarks.id
      `
        db.all(query, async function (err, rows) {
          if (err) reject(err)

          resolve(rows)
        })
      })
      .catch(reject)
  })
}
