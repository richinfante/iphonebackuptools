const fs = require('fs')
const path = require('path')

const log = require('../../util/log')
const bplist = require('bplist-parser')

module.exports = {
  version: 4,
  name: 'backup.status',
  description: `Gets a backup's status`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
  async run (lib, { backup }) {
    // Load and parse status for the backup.
    log.verbose('parsing status', backup.path)
    let data = bplist.parseBuffer(fs.readFileSync(path.join(backup.path, 'Status.plist')))[0]

    return data
  },

  // Status fields.
  output: {
    uuid: el => el.UUID,
    isFullBackup: el => el.IsFullBackup,
    version: el => el.Version, // backup version
    backupState: el => el.BackupState,
    date: el => el.Date,
    snapshotState: el => el.SnapshotState
  }
}
