module.exports = {
  version: 3,
  name: 'apps',
  description: `List all installed applications and container IDs.`,
  requiresBackup: true,

  // Run on a v3 lib / backup object.
  run (lib, { backup }) {
    return new Promise(async (resolve, reject) => {
      try {
        // This report directly depends on manifest report.
        // If it fails, so do we.
        let manifest = await lib.run('backup.manifest', { backup, raw: true })

        // Fetch each app in the manifest.
        var apps = []
        for (var key in manifest.Applications) {
          var app = manifest.Applications[key]

          apps.push({ bundleID: app.CFBundleIdentifier, path: app.Path })
        }

        resolve(apps)
      } catch (e) {
        reject(e)
      }
    })
  },

  // Fields for apps report
  output: {
    bundleID: el => el.bundleID,
    path: el => el.path
  }
}
