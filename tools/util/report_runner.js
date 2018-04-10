const version = require('./version_compare')
const iPhoneBackup = require('./iphone_backup.js').iPhoneBackup
const log = require('./log')

async function runSwitchedReport (report, program) {
  log.verbose('runner got path', program.base)
  async function createPromise (key, program, backup) {
    log.verbose('resolving using promises.')

    return new Promise((resolve, reject) => {
      report.functions[key](program, backup, resolve, reject)
    })
  }

  // New type of reports
  var backup = iPhoneBackup.fromID(program.backup, program.base)

  var flag = false
  var value
  // Check for a compatible reporting tool.
  for (var key in report.functions) {
    if (version.versionCheck(backup.iOSVersion, key)) {
      if (!report.usesPromises) {
        log.verbose('using synchronous call.')

        value = report.functions[key](program, backup)
      } else {
        // Use promises to resolve synchronously
        value = await createPromise(key, program, backup)
      }
      flag = true
      break
    }
  }

  if (!flag) {
    log.error(`Couldn't run '${report.name}'.`)
    log.error(`The report generator '${report.name}' does not support iOS`, backup.iOSVersion)
    log.error(`If you think it should, file an issue here:`)
    log.error(`https://github.com/richinfante/iphonebackuptools/issues`)
    return null
  }

  return value
}

async function runSingleReport (report, program) {
  log.verbose('runner got path', program.base)
  async function createPromise (program, backup, base) {
    log.verbose('resolving using promises.')

    return new Promise((resolve, reject) => {
      if (report.requiresBackup) {
        report.func(program, backup, resolve, reject)
      } else {
        report.func(program, base, resolve, reject)
      }
    })
  }

  async function runReport (backup, base) {
    if (!report.usesPromises) {
      log.verbose('using synchronous call.')

      // Old-style non-promise based report.
      if (report.requiresBackup) {
        return report.func(program, backup)
      } else {
        return report.func(program, base)
      }
    } else {
      // Create a promise to resolve this function
      // Use promises to resolve synchronously
      return createPromise(program, backup, base)
    }
  }

  // New type of reports
  var backup = iPhoneBackup.fromID(program.backup, program.base)

  if (report.supportedVersions !== undefined) {
    if (version.versionCheck(backup.iOSVersion, report.supportedVersions)) {
      return runReport(backup, program.base)
    } else {
      log.error(`Couldn't run '${report.name}'.`)
      log.error(`The report generator '${report.name}' does not support iOS`, backup.iOSVersion)
      log.error(`If you think it should, file an issue here:`)
      log.error(`https://github.com/richinfante/iphonebackuptools/issues`)
      return null
    }
  } else {
    return runReport(backup, program.base)
  }
}

module.exports.runSwitchedReport = runSwitchedReport
module.exports.runSingleReport = runSingleReport
