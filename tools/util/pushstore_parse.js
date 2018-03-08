
const ARCHIVER_KEY = '$archiver'
const TOP_KEY = '$top'
const OBJECTS_KEY = '$objects'
const CLASS_KEY = '$class'
const CLASSNAME_KEY = '$classname'
const NS_OBJECTS = 'NS.objects'
const NS_KEYS = 'NS.keys'
const NS_TIME = 'NS.time'
const NS_MUTABLE_DICTIONARY = 'NSMutableDictionary'
const DEFAULT_KEYS = ['AppNotificationCreationDate',
                      'RequestedDate',
                      'TriggerDate',
                      'AppNotificationMessage']
const UNIX_OFFSET = 978307200

const run = (pushstore) => {
  const pushstoreEntries = []
  if (is_valid_pushstore(pushstore)) {
    let top = get_top(pushstore)
    if (top == -1) {
      throw "Unable to get $top location!"
      return false
    }
    pushstore.objects_list = pushstore[OBJECTS_KEY]

    let pointer_to_entries = load_from_location(pushstore, top)
    pointer_to_entries['objects'].every((entry_offset) => {
      let entry_dict = make_entry_dict(pushstore, load_from_location(pushstore, entry_offset))
      let formatted = format_entry(pushstore, entry_dict)
      pushstoreEntries.push(formatted)
      return true
    })
  }
  return pushstoreEntries
}

const is_valid_pushstore = (pushstore) => {
  // Check version and archiver key
  return pushstore[ARCHIVER_KEY] === "NSKeyedArchiver"
}

const get_top = (pushstore) => {
  // Find pointer in $objects to starting point
  try {
    return parseInt(pushstore[TOP_KEY]['root']['UID'])
  } catch (e) {
    throw e
  }
}

const load_from_location = (pushstore, offset) => {
  // Load objects (and keys) from a location
  let loaded_dict = {}
  let start = pushstore.objects_list[offset]
  //pushstore.start = start
  let loaded_class = get_classname_at(start, pushstore)

  if (!loaded_class) {
    throw "Unable to determine $classname of key!"
  }
  loaded_dict['class'] = loaded_class
  loaded_dict['objects'] = start[NS_OBJECTS].map((x) => parseInt(x['UID']))

  if (loaded_class === NS_MUTABLE_DICTIONARY) {
    loaded_dict['keys'] = start[NS_KEYS].map((x) => parseInt(x['UID']))
  }

  return loaded_dict
}

const get_classname_at = (start, pushstore) => {
  // Get the classname of the object referenced
  try {
    return pushstore.objects_list[parseInt(start[CLASS_KEY]['UID'])][CLASSNAME_KEY]
  } catch (e) {
    throw e
  }
}

const make_entry_dict = (pushstore, loaded) => {
  // Make dict from offset and keys
  let entries = {}
  let offsets = loaded['objects']
  let keys = loaded['keys']

  let i = 0
  while (i < keys.length) {
    entries[pushstore.objects_list[keys[i]]] = pushstore.objects_list[offsets[i]]
    i++
  }
  return entries
}

const format_entry = (pushstore, entry_dict) => {
  // Format each of the entries
  let formatted = {}
  formatted['AppNotificationCreationDate'] = safe_get_time(pushstore, entry_dict, 'AppNotificationCreationDate')
  formatted['RequestedDate'] = safe_get_time(pushstore, entry_dict, 'RequestedDate')
  formatted['TriggerDate'] = safe_get_time(pushstore, entry_dict, 'TriggerDate')
  formatted['AppNotificationMessage'] = entry_dict['AppNotificationMessage']
  formatted['AppNotificationTitle'] = entry_dict['AppNotificationTitle'] ? entry_dict['AppNotificationTitle'] : 'N/A'

  return formatted
}

const safe_get_time = (pushstore, in_dict, key) => {
  // Safely get a timestamp
  try {
    if (in_dict && in_dict[key] && in_dict[key][NS_TIME])
      return to_real_time(in_dict[key][NS_TIME])
    return 'N/A'
  } catch (e) {
    throw e
  }
}

const to_real_time = (ns_time) => {
  // Convert an NSTime to UTC timestamp string
  return new Date((ns_time + UNIX_OFFSET) * 1000).toISOString()
}

module.exports = {
  run: run
}
