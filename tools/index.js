#!/usr/bin/env node

const program = require('commander')
const path = require('path')
const chalk = require('chalk')
const version = require('./util/version_compare')
const iPhoneBackup = require('./util/iphone_backup.js').iPhoneBackup
var base = path.join(process.env.HOME, '/Library/Application Support/MobileSync/Backup/')

var reportTypes = {
  'apps': require('./reports/apps'),
  'calls': require('./reports/calls'),
  'conversations': require('./reports/conversations'),
  'list': require('./reports/list'),
  'manifest': require('./reports/manifest'),
  'messages': require('./reports/messages'),
  'notes': require('./reports/notes'),
  'oldnotes': require('./reports/oldnotes'),
  'photolocations': require('./reports/photolocations'),
  'voicemail-files': require('./reports/voicemail-files'),
  'voicemail': require('./reports/voicemail'),
  'webhistory': require('./reports/webhistory'),
  'wifi': require('./reports/wifi')
}

var formatters = {
  'json': require('./formatters/json'),
  'table': require('./formatters/table'),
  'raw': require('./formatters/raw'),
  'csv': require('./formatters/csv')
}

program
    .version('3.0.0')
    .option('-l, --list', 'List Backups')
    .option(`-b, --backup <backup>`, 'Backup ID')
    .option(`-d, --dir <directory>`, `Backup Directory (default: ${base})`)
    .option('-r, --report <report_type>', 'Select a report type. see below for a full list.')
    .option('-i, --id <id>', 'Specify an ID for filtering certain reports')
    .option('-f, --formatter <type>', 'Specify output format. default: table')
    .option(`-e, --extract <dir>`, 'Extract data for commands. supported by: voicemail-files')
    .option(`-f, --filter <filter>`, 'Filter output for individual reports. See the README for usage.')
    .option(`-v, --verbose`, 'Verbose debugging output')
    .option(`-x, --no-color`, 'Disable colorized output')

program.on('--help', function () {
  console.log('')
  console.log('Supported Report Types:')
  for (var i in reportTypes) {
    if (program.isTTY) {
      console.log('  ', reportTypes[i].name, '-', reportTypes[i].description)
    } else {
      console.log('  ', chalk.green(reportTypes[i].name), '-', reportTypes[i].description)
    }
  }
  console.log('')
  console.log("If you're interested to know how this works, check out my post:")
  console.log('https://www.richinfante.com/2017/3/16/reverse-engineering-the-ios-backup')
  console.log('')
  console.log('Issue tracker:')
  console.log('https://github.com/richinfante/iphonebackuptools/issues')
  console.log('')
})

program.parse(process.argv)

// Global verbose output flag.
// This is bad
global.verbose = program.verbose

// Save the formatter
program.formatter = formatters[program.formatter] || formatters.table

if (!process.stdout.isTTY) { program.color = false }

base = program.dir || base

if (program.verbose) console.log('Using source:', base)

if (program.list) {
    // Shortcut for list report
  reportTypes.list.func(program, base)
} else if (program.report) {
    // If the report is valid
  if (reportTypes[program.report]) {
    var report = reportTypes[program.report]

    // Check if there's a backup specified and one is required.
    if (report.requiresBackup) {
      if (!program.backup) {
        console.log('use -b or --backup <id> to specify backup.')
        process.exit(1)
      }
    }

    // Try to use it
    if (report.func) {
      try {
        // New type of reports
        var backup = iPhoneBackup.fromID(program.backup, base)
        
        if (report.supportedVersions !== undefined) {
          if (version.versionCheck(backup.iOSVersion, report.supportedVersions)) {
            if (report.requiresBackup) {
              report.func(program, backup)
            } else {
              report.func(program, base)
            }
          } else {
            console.log('[!] The report generator "' + program.report + '" does not support iOS', backup.iOSVersion)
            console.log('')
            console.log('    If you think it should, file an issue here:')
            console.log('    https://github.com/richinfante/iphonebackuptools/issues')
            console.log('')
            process.exit(1)
          }
        } else {
          if (report.requiresBackup) {
            report.func(program, backup)
          } else {
            report.func(program, base)
          }
        }
      } catch (e) {
        console.log('[!] Encountered an error', e)
      }
    } else if (report.functions) {
      // New type of reports
      var backup = iPhoneBackup.fromID(program.backup, base)

      var flag = false

      // Check for a compatible reporting tool.
      for (var key in report.functions) {
        if (version.versionCheck(backup.iOSVersion, key)) {
          report.functions[key](program, backup)
          flag = true
          break
        }
      }

      if (!flag) {
        console.log('[!] The report generator "', program.report,'" does not support iOS', backup.iOSVersion)
        console.log('')
        console.log('    If you think it should, file an issue here:')
        console.log('    https://github.com/richinfante/iphonebackuptools/issues')
        console.log('')
        process.exit(1)
      }
    }
  } else {
    console.log('')
    console.log('  [!] Unknown Option type:', program.report)
    console.log('  [!] It\'s possible this tool is out-of date.')
    console.log('  https://github.com/richinfante/iphonebackuptools/issues')
    console.log('')
    program.outputHelp()
  }
} else {
  program.outputHelp()
}
