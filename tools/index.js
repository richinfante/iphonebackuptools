#!/usr/bin/env node

const chalk = require('chalk')
const fs = require('fs')
const program = require('commander')
const path = require('path')
const { URL } = require('url')
const stripAnsi = require('strip-ansi')
const iPhoneBackup = require('./util/iphone_backup.js').iPhoneBackup
const normalizeCols = require('./util/normalize.js')
var base = path.join(process.env.HOME, '/Library/Application Support/MobileSync/Backup/')

program
    .version('2.0.0')
    .option('-l, --list', 'List Backups')
    .option('-c, --conversations', 'List Conversations')
    .option('-m, --messages <conversation_id>', 'List Conversations')
    .option('-r, --report <report_type>', 'Report types: apps, notes, webhistory, photolocations, manifest')
    .option(`-d, --dir <directory>`, `Backup Directory (default: ${base})`)
    .option(`-u, --device <device>`, 'Device UUID')
    .option(`-b, --backup <backup>`, 'Backup ID')
    .option(`-v, --verbose`, 'Verbose debugging output')
    .option(`-x, --no-color`, 'Disable colorized output')
    .option('-z, --dump', 'Dump a ton of raw JSON formatted data instead of formatted output')
    
program.on('--help', function(){
    console.log('')
    console.log("If you're interested to know how this works, check out my post:")
    console.log("https://www.richinfante.com/2017/3/16/reverse-engineering-the-ios-backup")
    console.log('')
})
    
program.parse(process.argv);

if(!process.stdout.isTTY) { program.color = false }

base = program.dir || base

if(program.verbose) console.log('Using source:', base)

if(program.list) {
    var items = fs.readdirSync(base, { encoding: 'utf8' })
        .filter(el => (el.length == 40))
        .map(file => iPhoneBackup.fromID(file, base))
        
        
        // Possibly dump output
        if(program.dump) {
            console.log(JSON.stringify(items, null, 4))
            return
        }

    items = items.map(el => { 
            return {
            encrypted: el.manifest ? el.manifest.IsEncrypted 
                                        ? chalk.green('encrypted') 
                                        : chalk.red('not encrypted')
                                   : 'unknown encryption',
            device_name: el.manifest ? el.manifest.Lockdown.DeviceName : 'Unknown Device',
            device_id: el.id,
            serial: el.manifest.Lockdown.SerialNumber,
            iOSVersion: el.manifest.Lockdown.ProductVersion + '(' + el.manifest.Lockdown.BuildVersion + ')',
            backupVersion: el.status ? el.status.Version : '?',
            date: el.status ? new Date(el.status.Date).toLocaleString() : ''
        }})
        .map(el => [
            chalk.gray(el.device_id), 
            el.encrypted,
            el.date, 
            el.device_name,
            el.serial,
            el.iOSVersion,
            el.backupVersion
        ])

    items = [
        ['UDID', 'Encryption', 'Date', 'Device Name', 'Serial #', 'iOS Version', 'Backup Version'],
        ['-','-','-','-','-','-','-'],
            ...items
    ]
    items = normalizeCols(items)
    items = items.map(el => el.join(' | ')).join('\n')

    if(!program.color) { items = stripAnsi(items) }

    console.log('BACKUPS LIST')
    console.log(items)
} else if (program.conversations) {
    if(!program.backup) {
        console.log('use -b or --backup <id> to specify backup.')
        process.exit(1)
    }

    // Grab the backup
    var backup = iPhoneBackup.fromID(program.backup, base)


    backup.getConversations(program.dump)
    .then((items) => {
        if(program.dump) return 

        var items = items.map(el => [ 
            el.ROWID + '', 
            chalk.gray(el.XFORMATTEDDATESTRING || '??'),
            el.chat_identifier + '',
            el.display_name + ''
        ])

        items = [['ID', 'DATE', 'Chat Name', 'Display Name'], ['-', '-', '-', '-',], ...items]
        items = normalizeCols(items).map(el => el.join(' | ')).join('\n')
        
        if(!program.color) { items = stripAnsi(items) }

        console.log(items)
    })
    .catch((e) => {
        console.log('[!] Encountered an Error:', e)
    })
} else if(program.messages) {
    if(!program.backup) {
        console.log('use -b or --backup <id> to specify backup.')
        process.exit(1)
    }

    // Grab the backup
    var backup = iPhoneBackup.fromID(program.backup, base)


    backup.getMessages(program.messages, program.dump)
    .then((items) => {
        if(program.dump) return 

        items = items.map(el => [
            chalk.gray(el.XFORMATTEDDATESTRING + ''),
            chalk.blue(el.x_sender + ''),
            el.text || ''
        ])

        items = normalizeCols(items, 2).map(el => el.join(' | ')).join('\n')

        if(!program.color) { items = stripAnsi(items) }

        console.log(items)
    })
    .catch((e) => {
        console.log('[!] Encountered an Error:', e)
    })
} else if(program.report) {
    ///
    /// APPS REPORT
    ///
    if(program.report == 'apps') {
        if(!program.backup) {
            console.log('use -b or --backup <id> to specify backup.')
            process.exit(1)
        }

        // Grab the backup
        var backup = iPhoneBackup.fromID(program.backup, base)

        if (!backup.manifest) return {}

        // Possibly dump output
        if(program.dump) {
            console.log(JSON.stringify(backup.manifest, null, 4))
            return
        }

        // Enumerate the apps in the backup
        var apps = []
        for (var key in backup.manifest.Applications) {
            apps.push(key)
        }

        console.log(`Apps installed inside backup: ${backup.id}`)
        console.log(apps.map(el => '- ' + el).join('\n'))
    } else if(program.report == 'oldnotes') {
        if(!program.backup) {
            console.log('use -b or --backup <id> to specify backup.')
            process.exit(1)
        }

        // Grab the backup
        var backup = iPhoneBackup.fromID(program.backup, base)
        backup.getOldNotes(program.dump)
            .then((items) => {
                // Dump if needed
                if(program.dump) {
                    console.log(JSON.stringify(items, null, 4))
                    return
                }
                
                // Otherwise, format table
                items = items.map(el => [el.XFORMATTEDDATESTRING + '', (el.Z_PK + ''), (el.ZTITLE + '').substring(0, 128)])
                items = [['Modified', 'ID', 'Title'], ['-', '-', '-'], ...items]
                items = normalizeCols(items).map(el => el.join(' | ')).join('\n')
                
                if(!program.color) { items = stripAnsi(items) }

                console.log(items)
            })
            .catch((e) => {
                console.log('[!] Encountered an Error:', e)
            })
    } else if(program.report == 'notes') {
        if(!program.backup) {
            console.log('use -b or --backup <id> to specify backup.')
            process.exit(1)
        }

        // Grab the backup
        var backup = iPhoneBackup.fromID(program.backup, base)
        backup.getNotes(program.dump)
            .then((items) => {
                // Dump if needed
                if(program.dump) {
                    console.log(JSON.stringify(items, null, 4))
                    return
                }
                
                // Otherwise, format table
                items = items.map(el => [
                    (el.XFORMATTEDDATESTRING || el.XFORMATTEDDATESTRING1 )+ '', 
                    (el.Z_PK + ''), 
                    (el.ZTITLE2+ '').trim().substring(0, 128), 
                    (el.ZTITLE1+ '').trim() || ''
                ])
                items = [['Modified', 'ID', 'Title2', 'Title1'], ['-', '-', '-', '-'], ...items]
                items = normalizeCols(items, 3).map(el => el.join(' | ')).join('\n')
                
                if(!program.color) { items = stripAnsi(items) }

                console.log(items)
            })
            .catch((e) => {
                console.log('[!] Encountered an Error:', e)
            })
    }  else if(program.report == 'webhistory') {
        if(!program.backup) {
            console.log('use -b or --backup <id> to specify backup.')
            process.exit(1)
        }

        // Grab the backup
        var backup = iPhoneBackup.fromID(program.backup, base)
        backup.getWebHistory(program.dump)
            .then((history) => {

                if(program.dump) {
                    console.log(JSON.stringify(history, null, 4))
                    return
                }

                var items = history.map(el => [
                    el.XFORMATTEDDATESTRING + '' || '',
                    new URL(el.url || '').origin || '',
                    (el.title || '').substring(0, 64)
                ])

                items = [['Time', 'URL', 'Title'], ['-', '-', '-'], ...items]
                items = normalizeCols(items).map(el => el.join(' | ').replace(/\n/g, '')).join('\n')
                
                if(!program.color) { items = stripAnsi(items) }

                console.log(items)
            })
            .catch((e) => {
                console.log('[!] Encountered an Error:', e)
            })
    } else if(program.report == 'photolocations') {
        if(!program.backup) {
            console.log('use -b or --backup <id> to specify backup.')
            process.exit(1)
        }


        // Grab the backup
        var backup = iPhoneBackup.fromID(program.backup, base)
        backup.getPhotoLocationHistory(program.dump)
            .then((history) => {

                if(program.dump) {
                    console.log(JSON.stringify(history, null, 4))
                    return
                }

                var items = history.map(el => [
                    el.XFORMATTEDDATESTRING + '' || '',
                    el.ZLATITUDE + '' || '',
                    el.ZLONGITUDE  + '' || '',
                    el.ZFILENAME + '' || ''
                ])

                items = [['Time', 'Latitude', 'Longitude', 'Photo Name'], ['-', '-', '-'], ...items]
                items = normalizeCols(items).map(el => el.join(' | ').replace(/\n/g, '')).join('\n')

                if(!program.color) { items = stripAnsi(items) }

                console.log(items)
            })
            .catch((e) => {
                console.log('[!] Encountered an Error:', e)
            })
    }  else if(program.report == 'manifest') {
        if(!program.backup) {
            console.log('use -b or --backup <id> to specify backup.')
            process.exit(1)
        }


        // Grab the backup
        var backup = iPhoneBackup.fromID(program.backup, base)
        backup.getFileManifest()
            .then((items) => {

                if(program.dump) {
                    console.log(JSON.stringify(items, null, 4))
                    return
                }

                var items = items.map(el => [
                    el.fileID + '',
                    el.relativePath + '' 
                ])

                items = [['ID', 'Path'], ['-', '-'], ...items]
                items = normalizeCols(items).map(el => el.join(' | ').replace(/\n/g, '')).join('\n')
                
                if(!program.color) { items = stripAnsi(items) }

                console.log(items)
            })
            .catch((e) => {
                console.log('[!] Encountered an Error:', e)
            })
    } else if(program.report == 'calls') {
        if(!program.backup) {
            console.log('use -b or --backup <id> to specify backup.')
            process.exit(1)
        }


        // Grab the backup
        var backup = iPhoneBackup.fromID(program.backup, base)
        backup.getCallsList()
            .then((items) => {

                if(program.dump) {
                    console.log(JSON.stringify(items, null, 4))
                    return
                }

                var items = items.map(el => [
                    el.Z_PK + '',
                    el.XFORMATTEDDATESTRING,
                    el.ZANSWERED + '',
                    el.ZORIGINATED + '',
                    el.ZCALLTYPE + '',
                    el.ZDURATION + '',
                    el.ZLOCATION + '',
                    el.ZISO_COUNTRY_CODE + '',
                    el.ZSERVICE_PROVIDER + '',
                    (el.ZADDRESS || '').toString()
                ])

                items = [['ID', 'Date', 'Answered', 'Originated', 'Type', 'Duration', 'Location', 'Country', 'Service', 'Address'], ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-'], ...items]
                items = normalizeCols(items).map(el => el.join(' | ').replace(/\n/g, '')).join('\n')
                
                if(!program.color) { items = stripAnsi(items) }

                console.log(items)
            })
            .catch((e) => {
                console.log('[!] Encountered an Error:', e)
            })
    }  else if(program.report == 'wifi') {
        if(!program.backup) {
            console.log('use -b or --backup <id> to specify backup.')
            process.exit(1)
        }


        // Grab the backup
        var backup = iPhoneBackup.fromID(program.backup, base)
        backup.getWifiList()
            .then((items) => {

                if(program.dump) {
                    console.log(JSON.stringify(items, null, 4))
                    return
                }

                var items = items['List of known networks'].map(el => [
                    el.lastJoined + '' || '',
                    el.lastAutoJoined + '' || '',
                    el.SSID_STR + '',
                    el.BSSID + '',
                    el.SecurityMode || '',
                    el.HIDDEN_NETWORK + '',
                    el.enabled + '',
                ]).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())

                items = [['Last Joined', 'Last AutoJoined', 'SSID', 'BSSID','Security', 'Hidden', 'Enabled'], ['-', '-', '-', '-', '-', '-'], ...items]
                items = normalizeCols(items).map(el => el.join(' | ').replace(/\n/g, '')).join('\n')
                
                if(!program.color) { items = stripAnsi(items) }

                console.log(items)
            })
            .catch((e) => {
                console.log('[!] Encountered an Error:', e)
            })
    } else {
        console.log('')
        console.log('  [!] Unknown Option type:', program.report)
        console.log('')
        program.outputHelp()
    }
} else {
    program.outputHelp()
}
