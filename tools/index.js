#!/usr/bin/env node

const program = require('commander')
const path = require('path')
const chalk = require('chalk')
const log = require('./util/log')
const report = require('./reports')
const matcher = require('./util/matcher')
const Group = report.Group
const Backup3 = require('./backup3')

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
  console.log(`Version: ${require('../package.json').version}`)
  console.log('')
  console.log('Supported Report Types:')

  // Print a report group and recursively print children
  function printGroup (group, i) {
    i = i || 0

    for (let [name, report] of Object.entries(group)) {
      if (report instanceof Group) {
        console.log(`${' '.repeat(i * 2)}- ${chalk.green(name)}`.padStart(i * 2))
        printGroup(report, i + 1)
      } else {
        console.log(`${' '.repeat(i * 2)}- ${chalk.green(name)}${report.deprecated ? chalk.gray(' [deprecated]') : ''}: ${report.description} `)
      }
    }
  }

  printGroup(reportTypes)

  console.log('')
  console.log("If you're interested to know how this works, check out my post:")
  console.log('https://www.richinfante.com/2017/3/16/reverse-engineering-the-ios-backup')
  console.log('')
  console.log('Issue tracker:')
  console.log('https://github.com/richinfante/iphonebackuptools/issues')
  console.log('')
})

process.on('unhandledRejection', (e) => {
  console.log('[index.js] unhandled rejection', e)
  process.exit(1)
})

// If we're the main module, run some things.
if (require.main === module) {
  program.parse(process.argv)
}

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
if (require.main === module) {
  main().then(() => {})
}

function findReport (query) {
  return new Promise((resolve, reject) => {
    // Check there is no wildcard in the query.
    if (query.indexOf('*') > -1) {
      return reject(new Error('Cannot run a wildcard match here.'))
    }

    // Run matches.
    let matches = matcher(reportTypes, query, (el) => !(el instanceof Group))

    // If no report found, fail.
    if (matches.length === 0) {
      return reject(new Error(`No report found with name "${query}"`))
    }

    // If multiple matches, fail.
    if (matches.length > 1) {
      return reject(new Error(`Multiple report matches for name "${query}", not allowed.`))
    }

    // Resolve match
    resolve(matches[0])
  })
}

function findAndRun (query, params) {
  return new Promise(async (resolve, reject) => {
    let report = await findReport(query)

    resolve(runReport(report, params))
  })
}

function runReport (report, params) {
  params = params || {}

  return new Promise((resolve, reject) => {
    var backup

    // Cannot run < v3 backups in this manner.
    if (!report.version || report.version < 3) {
      return reject(new Error(`Cannot call ${report.name}, it is not updated to the latest version`))
    }

    if (report.requiresBackup) {
      if (!params.backup) {
        return reject(new Error('use -b or --backup <id> to specify backup.'))
      }

      backup = new Backup3(base, params.backup)
    }

    // Create a library.
    let lib = {
      run: function findAndRun (query, params) {
        return new Promise(async (resolve, reject) => {
          let report = await findReport(query)
          let result = await runReport(report, params)

          if (!params.raw && report.output) {
            if (result instanceof Array) {
              // if it's an array, translate each item.
              result = result.map(item => {
                let editedResult = {}
                for (let [key, value] of Object.entries(report.output)) {
                  editedResult[key] = value(item)
                }

                return editedResult
              })

              resolve(result)
            } else {
              // Otherwise, translate the object returned.
              let editedResult = {}
              for (let [key, value] of Object.entries(report.output)) {
                editedResult[key] = value(result)
              }

              resolve(result)
            }
          } else {
            resolve(result)
          }
        })
      },
      base: program.base
    }

    // Input params to func
    let inputParams = {
      ...params,
      backup
    }

    report.run(lib, inputParams)
      .then(resolve)
      .catch(reject)
  })
}

module.exports.run = findAndRun

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

    // Match an array of reports.
    for (let query of selectedTypes) {
      selectedReports = [
        ...selectedReports,
        ...matcher(reportTypes, query, (el) => !(el instanceof Group))
      ]
    }

    let set = new Set(selectedReports)

    if (set.size === 0) {
      log.error(`Couldn't run reports specified by: '${program.report}'.`)
      log.error(`No matching reports were found.`)
    }

    for (let report of set.values()) {
      if (report.version && report.version >= 3) {
        try {
          log.begin('run', report.name)

          // Run a v3 report.
          let contents = await runReport(report, {
            backup: program.backup,
            extract: program.extract,
            filter: program.filter,
            id: program.id
          })

          // Format the v3 report's result.
          program.formatter.format(contents, {
            program,
            columns: report.output
          })

          // Push onto the list to be compiled.
          reportContents.push({
            name: report.name,
            contents: contents
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
