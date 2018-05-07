#!/usr/bin/env node

const program = require('commander')
const chalk = require('chalk')
const log = require('./util/log')
const report = require('./reports')
const matcher = require('./util/matcher')
const Group = report.Group
const core = require('./index')
const packageJSON = require('../package.json')

const { runSingleReport, runSwitchedReport } = require('./util/report_runner')

var formatters = {
  'json': require('./formatters/json'),
  'table': require('./formatters/table'),
  'raw': require('./formatters/raw-json'),
  'raw-json': require('./formatters/raw-json'),
  'csv': require('./formatters/csv'),
  'raw-csv': require('./formatters/raw-csv')
}

process.on('unhandledRejection', (e) => {
  console.log('[cli.js] unhandled rejection', e)
  process.exit(1)
})

program
  .version(packageJSON.version)
  .option('-l, --list', 'List Backups')
  .option(`-b, --backup <backup>`, 'Backup ID')
  .option(`-d, --dir <directory>`, `Backup Directory (default: ${core.base})`)
  .option('-r, --report <report_type>', 'Select a report type. see below for a full list.')
  .option('-i, --id <id>', 'Specify an ID for filtering certain reports')
  .option('-f, --formatter <type>', 'Specify output format. default: table')
  .option(`-e, --extract <dir>`, 'Extract data for commands. supported by: voicemail-files, manifest')
  .option('-o, --output <path>', 'Specify an output directory for files to be written to.')
  .option(`-v, --verbose`, 'Verbose debugging output')
  .option(`    --plugins <plugins>`, 'List of pluging modules to use')
  .option(`    --filter <filter>`, 'Filter output fo r individual reports. See the README for usage.')
  .option('    --join-reports', 'Join JSON reports together. (available for -f json or -f raw only!)')
  .option(`    --no-color`, 'Disable colorized output')
  .option(`    --dump`, 'alias for "--formatter raw"')
  .option(`    --quiet`, 'quiet all messages, except for errors and raw output')
  .option(`    --available`, 'output a list of available reports')

program.on('--help', function () {
  console.log('')
  console.log(`Version: ${packageJSON.version}`)
  console.log('')
  console.log('Run ibackuptool --available for a listing of report types.')

  console.log('')
  console.log("If you're interested to know how this works, check out my post:")
  console.log('https://www.richinfante.com/2017/3/16/reverse-engineering-the-ios-backup')
  console.log('')
  console.log('Issue tracker:')
  console.log('https://github.com/richinfante/iphonebackuptools/issues')
  console.log('')
})

function printReportList () {
  // Print a report group and recursively print children
  function printGroup (group, i, pn) {
    i = i || 0
    pn = pn || ''

    for (let [name, report] of Object.entries(group)) {
      // Ignore groups
      if (name === '__group') { continue }

      if (report instanceof Group || report.__group === true) {
        // console.log(`${' '.repeat(i * 2)}- ${pn}${name}`.padStart(i * 2))
        printGroup(report, i + 1, `${pn}${name}.`)
      } else {
        console.log(`- ${chalk.green(pn + name)}${report.deprecated ? chalk.gray(' [deprecated]') : ''}: ${report.description} `)
      }
    }
  }

  printGroup(core.modules)
}

process.on('unhandledRejection', (e) => {
  console.log('[index.js] unhandled rejection', e)
  process.exit(1)
})

// If we're the main module, run some things.
if (require.main === module) {
  init()
}

// Initialize the tool.
function init () {
  program.parse(process.argv)

  if (program.available) {
    printReportList()
    process.exit(0)
  }

  // Set the log level
  log.setVerbose(program.quiet ? 0 : (program.verbose ? 2 : 1))

  // Parse plugins
  program.plugins = program.plugins || process.env.IBACKUPTOOL_PLUGINS || ''
  program.plugins = program.plugins.split(',')
    .map(name => name.trim())
    .filter(name => name !== '')
    .map(path => require(path))

  // Register witht the core module
  core.registerModule(program.plugins)

  log.verbose('Plugins:', program.plugins)

  // Save the formatter
  program.formatter = formatters[program.formatter] || formatters.table

  // Legacy support for `--dump` flag.
  if (program.dump) {
    program.formatter = formatters.raw
  }

  // Disable color for non-ttys.
  if (!process.stdout.isTTY) { program.color = false }

  // Find the base if it is set
  if (program.dir) {
    core.base = program.dir
  }

  log.verbose('Base Directory:', core.base)

  main().then(() => {})
}

/**
 * Main CLI function
 */
async function main () {
  // Legacy support for --list (-l) flag
  if (program.list) {
    program.report = 'backups.list'
  }

  log.verbose('Top-level modules', Object.keys(core.modules))

  if (program.report) {
    var reportContents = []

    // Turn the report argument into an array of report type names
    var selectedTypes = program.report
      .split(',')
      .map(el => el.trim())
      .filter(el => el !== '')

    let selectedReports = []

    // Match an array of reports.
    for (let query of selectedTypes) {
      selectedReports = [
        ...selectedReports,
        ...matcher(core.modules, query, (el) => !(el instanceof Group || el.__group === true))
      ]
    }

    let set = new Set(selectedReports)

    log.verbose('selected set', set)

    // If the set's size is 0, throw an error.
    if (set.size === 0) {
      log.error(`Couldn't run reports specified by: '${program.report}'.`)
      log.error(`No matching reports were found.`)
      process.exit(1)
    }

    // Iterate over each item in the set.
    for (let report of set.values()) {
      if (report.version && report.version >= 3) {
        try {
          log.begin('run', report.name)

          // Create some parameters to send by default.
          let params = {
            backup: program.backup,
            extract: program.extract,
            filter: program.filter,
            id: program.id,
            raw: !!program.formatter.isRaw
          }

          // Run a v3 report.
          let contents = await core.runReport(report, params)

          // Possibly symbolicate
          contents = await core.compileReport(report, contents, params)

          // Format the v3 report's result.
          let formattedContent = program.formatter.format(contents, {
            program
          })

          // Push onto the list to be compiled.
          reportContents.push({
            name: report.name,
            contents: formattedContent
          })

          log.end()
        } catch (e) {
          log.end()
          log.error(`Couldn't run '${report.name}'.`)
          log.error(e)
        }
      } else {
        // Older reports still work for file and screen output
        // They just may not be as compatible
        // They cannot be called from the module's api.

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
    }

    program.formatter.finalReport(reportContents, program)
  } else {
    program.outputHelp()
  }
}
