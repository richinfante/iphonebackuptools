#!/usr/bin/env node

const program = require('commander')
const path = require('path')
const chalk = require('chalk')
const version = require('./util/version_compare')
const iPhoneBackup = require('./util/iphone_backup.js').iPhoneBackup
const log = require('./util/log')

var base = path.join(process.env.HOME, '/Library/Application Support/MobileSync/Backup/')

var reportTypes = {
  'apps': require('./reports/apps'),
  'calls': require('./reports/calls'),
  'conversations': require('./reports/conversations'),
  'conversations_full': require('./reports/conversations_full'),
  'cookies': require('./reports/cookies'),
  'list': require('./reports/list'),
  'manifest': require('./reports/manifest'),
  'messages': require('./reports/messages'),
  'notes': require('./reports/notes'),
  'oldnotes': require('./reports/oldnotes'),
  'photolocations': require('./reports/photolocations'),
  'voicemail-files': require('./reports/voicemail-files'),
  'voicemail': require('./reports/voicemail'),
  'webhistory': require('./reports/webhistory'),
  'calls_statistics': require('./reports/calls_statistics'),
  'wifi': require('./reports/wifi'),
  'address_book': require('./reports/address_book'),
  'safari_bookmarks': require('./reports/safari_bookmarks'),
  'pushstore': require('./reports/pushstore'),
  'calendar': require('./reports/calendar'),
  'facebook_profile': require('./reports/facebook_profile')
}

var formatters = {
  'json': require('./formatters/json'),
  'table': require('./formatters/table'),
  'raw': require('./formatters/raw-json'),
  'raw-json': require('./formatters/raw-json'),
  'csv': require('./formatters/csv'),
  'raw-csv': require('./formatters/raw-csv')
}

program
  .version('3.0.0')
  .option('-l, --list', 'List Backups')
  .option(`-b, --backup <backup>`, 'Backup ID')
  .option(`-d, --dir <directory>`, `Backup Directory (default: ${base})`)
  .option('-r, --report <report_type>', 'Select a report type. see below for a full list.')
  .option('-i, --id <id>', 'Specify an ID for filtering certain reports')
  .option('-f, --formatter <type>', 'Specify output format. default: table')
  .option(`-e, --extract <dir>`, 'Extract data for commands. supported by: voicemail-files, manifest')
  .option('-o, --output <path>', 'Specify an output directory for files to be written to.')
  .option(`-v, --verbose`, 'Verbose debugging output')
  .option(`    --filter <filter>`, 'Filter output fo r individual reports. See the README for usage.')
  .option('    --join-reports', 'Join JSON reports together. (available for -f json or -f raw only!)')
  .option(`    --no-color`, 'Disable colorized output')
  .option(`    --dump`, 'alias for "--formatter raw"')
  .option(`    --quiet`, 'quiet all messages, except for errors and raw output')

program.on('--help', function () {
  console.log('')
  console.log('Supported Report Types:')

  // Generate a list of report types.
  for (var i in reportTypes) {
    var r = reportTypes[i]
    console.log('  ', chalk.green(r.name), (r.supportedVersions ? chalk.gray('(iOS ' + r.supportedVersions + ') ') : '') + '-', r.description)
  }
  console.log('')
  console.log("If you're interested to know how this works, check out my post:")
  console.log('https://www.richinfante.com/2017/3/16/reverse-engineering-the-ios-backup')
  console.log('')
  console.log('Issue tracker:')
  console.log('https://github.com/richinfante/iphonebackuptools/issues')
  console.log('')
})

process.on('unhandledRejection', (e) => {
  console.log('unhandled', e)
  process.exit(1)
})

// Parse argv.
program.parse(process.argv)

log.setVerbose(program.quiet ? 0 : (program.verbose ? 2 : 1))

// Save the formatter
program.formatter = formatters[program.formatter] || formatters.table

// Legacy support for `--dump` flag.
if (program.dump) {
  program.formatter = formatters.raw
}

// Disable color for non-ttys.
if (!process.stdout.isTTY) { program.color = false }

// Find the base
base = program.dir || base

log.verbose('Using source:', base)

// Run the main function
main()

async function main () {
  if (program.list) {
    // Run the list report standalone
    await new Promise((resolve, reject) => {
      reportTypes.list.func(program, base, resolve, reject)
    })
  } else if (program.report) {
    var reportContents = []

    // Turn the report argument into an array of report type names
    var selectedTypes = program.report
      .split(',')
      .map(el => el.trim())
      .filter(el => el !== '')

    // Add all types if type is 'all'
    if (program.report === 'all') {
      selectedTypes = []

      for (var key in reportTypes) {
        if (reportTypes[key].requiresInteractivity === true) {
          continue
        }

        selectedTypes.push(key)
      }
    }

    for (var reportName of selectedTypes) {
      // If the report is valid
      if (reportTypes[reportName]) {
        var report = reportTypes[reportName]

        if (selectedTypes.length > 1 && !report.usesPromises) {
          log.warning('the report', report.name, 'does not utilize promises.')
          log.warning('this may not work')
        }

        log.begin('run', report.name)

        // Check if there's a backup specified and one is required.
        if (report.requiresBackup) {
          if (!program.backup) {
            log.error('use -b or --backup <id> to specify backup.')
            process.exit(1)
          }
        }
        try {
          if (report.func) {
            let contents = await runSingleReport(report, program)
            if (contents == null) { log.end(); continue }

            reportContents.push({
              name: reportName,
              contents: contents
            })
          } else if (report.functions) {
            let contents = await runSwitchedReport(report, program)
            if (contents == null) { log.end(); continue }

            reportContents.push({
              name: reportName,
              contents: contents
            })
          }
        } catch (e) {
          log.error(`Couldn't run '${report.name}'.`)
          log.error(e)
        }

        log.end()
      } else {
        log.error('Unknown report type:', reportName)
        log.error(`It's possible this tool is out-of date.`)
        log.error(`https://github.com/richinfante/iphonebackuptools/issues`)
        program.outputHelp()
      }
    }

    program.formatter.finalReport(reportContents, program)
  } else {
    program.outputHelp()
  }
}

async function runSwitchedReport (report, program) {
  async function createPromise (key, program, backup) {
    log.verbose('resolving using promises.')

    return new Promise((resolve, reject) => {
      report.functions[key](program, backup, resolve, reject)
    })
  }

  // New type of reports
  var backup = iPhoneBackup.fromID(program.backup, base)

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
  var backup = iPhoneBackup.fromID(program.backup, base)

  if (report.supportedVersions !== undefined) {
    if (version.versionCheck(backup.iOSVersion, report.supportedVersions)) {
      return runReport(backup, base)
    } else {
      log.error(`Couldn't run '${report.name}'.`)
      log.error(`The report generator '${report.name}' does not support iOS`, backup.iOSVersion)
      log.error(`If you think it should, file an issue here:`)
      log.error(`https://github.com/richinfante/iphonebackuptools/issues`)
      return null
    }
  } else {
    return runReport(backup, base)
  }
}
