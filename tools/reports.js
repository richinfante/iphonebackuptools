
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
    address_book: require('./reports/address_book'),
    speed_dial: require('./reports/phone/speed_dial'),
    voicemail: require('./reports/phone/voicemail')
  }),

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
    wifi: require('./reports/system/wifi'),
    bluetooth_devices: require('./reports/system/bluetooth_devices'),
    pushstore: require('./reports/system/pushstore'),
    apps: require('./reports/system/apps')
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
    history: require('./reports/safari/webhistory'),
    bookmarks: require('./reports/safari/bookmarks'),
    open_tabs: require('./reports/safari/open_tabs'),
    recent_searches: require('./reports/safari/recent_searches'),
    cookies: require('./reports/safari/cookies')
  }),

  // Spotify
  spotify: require('./reports/spotify')
}

module.exports.Group = Group
