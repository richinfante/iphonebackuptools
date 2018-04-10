
class Group {
  constructor (children) {
    for (let [ key, value ] of Object.entries(children)) {
      this[key] = value
    }
  }
}

module.exports.types = {
  // Notes report
  notes: new Group({
    v2: require('./reports/notes'),
    v1: require('./reports/oldnotes')
  }),

  // Camera report
  camera: new Group({
    locations: require('./reports/photolocations')
  }),

  // Calendar
  calendar: require('./reports/calendar'),

  // Reports related to messaging.
  messages: new Group({
    conversations: require('./reports/conversations'),
    conversations_full: require('./reports/conversations_full'),
    messages: require('./reports/messages')
  }),

  // System level reports, such as wifi
  system: new Group({
    wifi: require('./reports/wifi'),
    bluetooth_devices: require('./reports/bluetooth_devices'),
    pushstore: require('./reports/pushstore'),
    apps: require('./reports/apps')
  }),

  // Phone Data
  phone: new Group({
    calls: require('./reports/calls'),
    address_book: require('./reports/address_book'),
    speed_dial: require('./reports/speed_dial'),
    calls_statistics: require('./reports/calls_statistics'),
    voicemail_files: require('./reports/voicemail-files'),
    voicemail: require('./reports/voicemail')
  }),

  // Facebook Data
  facebook: new Group({
    profile: require('./reports/facebook_profile'),
    messenger: new Group({
      friends: require('./reports/facebook_messenger_friends')
    })
  }),

  // Safari Data
  safari: new Group({
    history: require('./reports/webhistory'),
    bookmarks: require('./reports/safari_bookmarks'),
    open_tabs: require('./reports/safari_open_tabs'),
    recent_searches: require('./reports/safari_recent_searches'),
    cookies: require('./reports/cookies')
  }),

  // Spotify
  spotify: require('./reports/spotify'),

  // Per-backup utilities
  backup: new Group({
    manifest: require('./reports/manifest')
  }),

  // Global utilities.
  backups: new Group({
    list: require('./reports/list')
  })
}

module.exports.Group = Group
