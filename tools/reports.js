
class Group {
  constructor (children) {
    for (let [ key, value ] of Object.entries(children)) {
      this[key] = value
    }
  }
}

module.exports.types = {
  // Global utilities.
  backups: new Group({
    list: require('./reports/backups/list')
  }),

  // Per-backup utilities
  backup: new Group({
    status: require('./reports/backup/status'),
    manifest: require('./reports/backup/manifest'),
    info: require('./reports/backup/info'),
    files: require('./reports/backup/files')
  }),

  // Phone Data
  phone: new Group({
    calls: require('./reports/phone/calls'),
    calls_statistics: require('./reports/phone/calls_statistics'),
    address_book: require('./reports/phone/address_book'),
    speed_dial: require('./reports/phone/speed_dial'),
    voicemail: require('./reports/phone/voicemail')
  }),

  // Notes report
  notes: require('./reports/notes/notes'),

  // Camera report
  photos: new Group({
    locations: require('./reports/photos/locations')
  }),

  // Calendar
  calendar: new Group({
    events: require('./reports/calendar/events')
  }),

  // Reports related to messaging.
  messages: new Group({
    all: require('./reports/messages/all'),
    conversations: require('./reports/messages/conversations'),
    messages: require('./reports/messages/messages'),
    conversations_full: require('./reports/messages/conversations_full')
  }),

  // Safari Data
  safari: new Group({
    history: require('./reports/safari/webhistory'),
    bookmarks: require('./reports/safari/bookmarks'),
    open_tabs: require('./reports/safari/open_tabs'),
    recent_searches: require('./reports/safari/recent_searches'),
    cookies: require('./reports/safari/cookies')
  }),

  // System level reports, such as wifi
  system: new Group({
    wifi: require('./reports/system/wifi'),
    bluetooth_devices: require('./reports/system/bluetooth_devices'),
    pushstore: require('./reports/system/pushstore'),
    apps: require('./reports/system/apps'),
    geofences: require('./reports/system/geofences')
  }),

  // Facebook Data
  facebook: new Group({
    profile: require('./reports/thirdparty/facebook/profile'),
    messenger: new Group({
      friends: require('./reports/thirdparty/facebook/messenger')
    })
  }),

  // Instagram data
  instagram: new Group({
    profile: require('./reports/thirdparty/instagram/profile'),
    recent_searches: require('./reports/thirdparty/instagram/recent_searches'),
    following_users_coded: require('./reports/thirdparty/instagram/following_users_coded'),
    fb_friends: require('./reports/thirdparty/instagram/fb_friends')
  }),

  // Gmail
  gmail: new Group({
    accounts: require('./reports/thirdparty/gmail/accounts'),
    shared_contacts: require('./reports/thirdparty/gmail/shared_contacts')
  }),

  // Spotify
  spotify: new Group({
    searches: require('./reports/thirdparty/spotify/searches')
  }),

  // Waze
  waze: new Group({
    favorites: require('./reports/thirdparty/waze/favorites'),
    places: require('./reports/thirdparty/waze/places'),
    recents: require('./reports/thirdparty/waze/recents')
  }),

  // Skype
  skype: new Group({
    accounts: require('./reports/thirdparty/skype/accounts'),
    calls: require('./reports/thirdparty/skype/calls')
  }),

  // Viber
  viber: new Group({
    contacts: require('./reports/thirdparty/viber/contacts'),
    calls: require('./reports/thirdparty/viber/calls'),
    messages: require('./reports/thirdparty/viber/messages')
  })
}

module.exports.Group = Group
