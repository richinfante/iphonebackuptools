#!/usr/bin/env node

const program = require('commander')
const path = require('path')
const chalk = require('chalk')
var base = path.join(process.env.HOME, '/Library/Application Support/MobileSync/Backup/')

var reportTypes = {
  'apps': require('./reports/apps'),
  'calls': require('./reports/calls'),
  'conversations': require('./reports/conversations'),
  'conversations_full': require('./reports/conversations_full'),
  //'list': require('./reports/list'),
  //'manifest': require('./reports/manifest'),
  'messages': require('./reports/messages'),
  'notes': require('./reports/notes'),
  'oldnotes': require('./reports/oldnotes'),
  'photolocations': require('./reports/photolocations'),
  'voicemail-files': require('./reports/voicemail-files'),
  'voicemail': require('./reports/voicemail'),
  'webhistory': require('./reports/webhistory'),
  'calls_statistics': require('./reports/calls_statistics'),
  'wifi': require('./reports/wifi'),
  'all': require('./reports/all')
}

program
    .version('2.0.5')
    .option('-l, --list', 'List Backups')
    .option(`-b, --backup <backup>`, 'Backup ID')
    .option('-r, --report <report_type>', 'Select a report type. see below for a full list.')
    .option('-c, --conversations', 'List Conversations')
    .option('-m, --messages <conversation_id>', 'List messages')
    .option(`-e, --extract <dir>`, 'Extract data for commands. supported by: voicemail-files')
    .option(`-d, --dir <directory>`, `Backup Directory (default: ${base})`)
    .option(`-v, --verbose`, 'Verbose debugging output')
    .option(`-x, --no-color`, 'Disable colorized output')
    .option('-z, --dump', 'Dump a ton of raw JSON formatted data instead of formatted output')

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
})

program.parse(process.argv)

if (!process.stdout.isTTY) { program.color = false }

base = program.dir || base

if (program.verbose) console.log('Using source:', base)

if (program.list) {
    // Shortcut for list report
  reportTypes.list.func(program, base)
} else if (program.conversations) {
    // Legacy shortcut for conversations report
  reportTypes.conversations.func(program, base)
} else if (program.messages) {
    // Legacy shortcut for messages report
  reportTypes.messages.func(program, base)
} else if (program.report) {
  if (program.report === 'all'){
    all();
  }
    // If the report is valid
  else if (reportTypes[program.report]) {
    var report = reportTypes[program.report]

    run_report(report);
  } else {
    console.log('')
    console.log('  [!] Unknown Option type:', program.report)
    console.log('  [!] It\'s possible this tool is out-of date.')
    console.log('')
    program.outputHelp()
  }
} else {
  program.outputHelp()
}

async function all() {
  let dump = {}
  for(let report of Object.entries(reportTypes)) {
    const reportName = report[0]
    report = report[1]
    // Try to use it
    if (report.func) {
      try {
        if (program.dump) {
          if (reportName !== "all"
           && reportName !== "conversations"
           && reportName !== "messages")
            dump[reportName] = await report.func(program, base)
        }
        else {
          //console.log(reportName);
          await report.func(program, base)
        }
      } catch (e) {
        console.log('[!] Encountered an error', e)
      }
    }
  }
  if (program.dump) console.log(JSON.stringify(dump, null, 4));
}

async function run_report(report) {
  // Try to use it
  if (report.func) {
    try {
      if (program.dump) console.log(JSON.stringify(await report.func(program, base), null, 4))
      else report.func(program, base)
    } catch (e) {
      console.log('[!] Encountered an error', e)
    }
  }
}