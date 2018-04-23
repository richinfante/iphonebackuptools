#!/usr/bin/env node

const program = require('commander')
const path = require('path')
const chalk = require('chalk')
const log = require('./util/log')
const report = require('./reports')
const matcher = require('./util/matcher')
const Group = report.Group
const Backup = require('./backup')

const packageJSON = require('../package.json')
const { runSingleReport, runSwitchedReport } = require('./util/report_runner')

var base = path.join(process.env.HOME, '/Library/Application Support/MobileSync/Backup/')

var defaultReports = report.types

var formatters = {
  'json': require('./formatters/json'),
  'table': require('./formatters/table'),
  'raw': require('./formatters/raw-json'),
  'raw-json': require('./formatters/raw-json'),
  'csv': require('./formatters/csv'),
  'raw-csv': require('./formatters/raw-csv')
}

program
  .version(packageJSON.version)
  .option('-l, --list', 'List Backups')
  .option(`-b, --backup <backup>`, 'Backup ID')
  .option(`-d, --dir <directory>`, `Backup Directory (default: ${base})`)
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

program.on('--help', function () {
  console.log('')
  console.log(`Version: ${packageJSON.version}`)
  console.log('')
  console.log('Supported Report Types:')

  // Print a report group and recursively print children
  function printGroup (group, i) {
    i = i || 0

    for (let [name, report] of Object.entries(group)) {
      // Ignore groups
      if (name === '__group') { continue }

      if (report instanceof Group || report.__group === true) {
        console.log(`${' '.repeat(i * 2)}- ${chalk.green(name)}`.padStart(i * 2))
        printGroup(report, i + 1)
      } else {
        console.log(`${' '.repeat(i * 2)}- ${chalk.green(name)}${report.deprecated ? chalk.gray(' [deprecated]') : ''}: ${report.description} `)
      }
    }
  }

  let moduleList = getCompleteModuleList()
  printGroup(moduleList)

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

  log.setVerbose(program.quiet ? 0 : (program.verbose ? 2 : 1))
  program.plugins = program.plugins || process.env.IBACKUPTOOL_PLUGINS || ''
  program.plugins = program.plugins.split(',')
    .map(name => name.trim())
    .filter(name => name !== '')
    .map(path => require(path))

  log.verbose('Plugins:', program.plugins)

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

  main().then(() => {})
}

/**
 * Get all modules in a top-down manner.
 */
function getCompleteModuleList () {
  let allModules = {}

  // Add all of the require()'d modules into the plugins list.
  program.plugins.forEach(function (plugin) {
    allModules = { ...allModules, ...plugin }
  })

  // Add all of the modules to a single object.
  // JS's behavior dictates that the items are added sequentially
  // So, the default reports overwrite any third party plugin.
  return {
    ...allModules,
    ...defaultReports
  }
}

/**
 * Try to find a single report.
 * @param {string} query name to find.
 */
function findReport (query) {
  return new Promise((resolve, reject) => {
    // Check there is no wildcard in the query.
    if (query.indexOf('*') > -1) {
      return reject(new Error('Cannot run a wildcard match here.'))
    }

    // Run matches.
    let matches = matcher(defaultReports, query, (el) => !(el instanceof Group))

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

/**
 * Translate the raw output of a report to the correct result, based on the "raw" parameter.
 * @param {Object} report The report module
 * @param {Object} result Raw data output from the aforementioned report
 * @param {Object} params parameters object.
 */
function compileReport (report, result, { raw }) {
  return new Promise((resolve, reject) => {
    if (!raw && report.output) {
      if (result instanceof Array) {
        log.verbose('compiling report (array)...')
        // if it's an array, translate each item.
        result = result.map(item => {
          // For each item, run the functions on the entry.
          let editedResult = {}
          for (let [key, value] of Object.entries(report.output)) {
            editedResult[key] = value(item)
          }

          return editedResult
        })

        resolve(result)
      } else {
        log.verbose('compiling report (single)...')
        // Otherwise, translate the object returned.
        let editedResult = {}
        for (let [key, value] of Object.entries(report.output)) {
          editedResult[key] = value(result)
        }

        resolve(editedResult)
      }
    } else {
      resolve(result)
    }
  })
}

/**
 * Run a named report and resolve to it's output.
 * The output MAY be formatted, if the params.raw option is set to true.
 * @param {string} query report name
 * @param {Object=} params parameters.
 */
function findAndRun (query, params) {
  params = params || {}
  return new Promise(async (resolve, reject) => {
    try {
      let report = await findReport(query)
      let result = await runReport(report, params)
      let compiled = await compileReport(report, result, params)

      resolve(compiled)
    } catch (e) {
      reject(e)
    }
  })
}

/**
 * Run a report
 * @param {object} report report module
 * @param {object=} params parameters
 */
function runReport (report, params) {
  params = params || {}

  return new Promise((resolve, reject) => {
    var backup

    // Cannot run < v3 backups in this manner.
    if (!report.version || report.version < 3) {
      return reject(new Error(`Cannot call ${report.name} as a module, it is not updated to the v3 api`))
    }

    // If it requires a backup and none is provided, reject.
    if (report.requiresBackup) {
      if (!params.backup) {
        return reject(new Error('use -b or --backup <id> to specify backup.'))
      }

      backup = new Backup(base, params.backup)
    }

    // Create a library.
    let lib = {
      run: findAndRun,
      base: base
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

async function main () {
  if (program.list) {
    program.report = 'backups.list'
  }

  // Get all the loaded modules
  let allModules = getCompleteModuleList()

  log.verbose('Top-level modules', Object.keys(allModules))

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
        ...matcher(allModules, query, (el) => !(el instanceof Group || el.__group === true))
      ]
    }

    let set = new Set(selectedReports)

    log.verbose('selected set', set)

    if (set.size === 0) {
      log.error(`Couldn't run reports specified by: '${program.report}'.`)
      log.error(`No matching reports were found.`)
      process.exit(1)
    }

    for (let report of set.values()) {
      if (report.version && report.version >= 3) {
        try {
          log.begin('run', report.name)

          let params = {
            backup: program.backup,
            extract: program.extract,
            filter: program.filter,
            id: program.id,
            raw: !!program.formatter.isRaw
          }

          // Run a v3 report.
          let contents = await runReport(report, params)

          // Possibly symbolicate
          contents = await compileReport(report, contents, params)

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

module.exports = {
  findAndRun,
  Backup,
  Group
}
