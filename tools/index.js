#!/usr/bin/env node

const program = require('commander')
const path = require('path')
const chalk = require('chalk')
const log = require('./util/log')
const report = require('./reports')
const matcher = require('./util/matcher')
const Group = report.Group

const { runSingleReport, runSwitchedReport } = require('./util/report_runner')

var base = path.join(process.env.HOME, '/Library/Application Support/MobileSync/Backup/')

var reportTypes = report.types

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
program.base = base

log.verbose('Using source:', program.base)

// Run the main function
main()

async function main () {
  if (program.list) {
    program.report = 'backups.list'
  }

  if (program.report) {
    var reportContents = []

    // Turn the report argument into an array of report type names
    var selectedTypes = program.report
      .split(',')
      .map(el => el.trim())
      .filter(el => el !== '')

    let selectedReports = []

    for (let query of selectedTypes) {
      selectedReports = [
        ...selectedReports,
        ...matcher(reportTypes, query, (el) => !(el instanceof Group))
      ]
    }

    for (let report of selectedReports) {
      if (selectedReports.length > 1 && !report.usesPromises) {
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
            name: report.name,
            contents: contents
          })
        } else if (report.functions) {
          let contents = await runSwitchedReport(report, program)
          if (contents == null) { log.end(); continue }

          reportContents.push({
            name: report.name,
            contents: contents
          })
        }
      } catch (e) {
        log.error(`Couldn't run '${report.name}'.`)
        log.error(e)
      }

      log.end()
    }

    program.formatter.finalReport(reportContents, program)
  } else {
    program.outputHelp()
  }
}
