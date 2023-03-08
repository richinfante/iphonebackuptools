# iPhone backup tools

[![Build Status](https://travis-ci.org/richinfante/iphonebackuptools.svg?branch=master)](https://travis-ci.org/richinfante/iphonebackuptools)
[![npm](https://img.shields.io/npm/v/ibackuptool.svg)](http://npmjs.com/ibackuptool)
![license](https://img.shields.io/github/license/richinfante/iphonebackuptools.svg)

Are _you_ storing unencrypted iPhone backups on your personal computer? With very little effort, we can dump **all** the saved messages from the backup, as well as notes, photo locations, and other data. 

Check out my recently updated post about my work on backups here: [Reverse Engineering the iOS Backup](https://www.richinfante.com/2017/3/16/reverse-engineering-the-ios-backup)

**This tool is also still fairly experimental, so use at your own risk! Even though the tool opens the backup files as read-only, you should still make a copy of your backups before using this if they are important.**

Currently works on macOS, not tested extensively on windows but should function properly. Please flag any issues!

## Documentation
This readme is intended to be an overview of features. Please read the [wiki](https://github.com/richinfante/iphonebackuptools/wiki) for more up-to-date and in-depth examples, and examples of how to make and use reports.

## iOS Support
iOS Support depends on the individual reporting types and which files are specifically present inside of the backup. When a report type is not supported, an error message is outputted to the terminal. Some reports, will output an error message if files that are required are not present in the backup.

## Reports List
the full report list is available [on the wiki](https://github.com/richinfante/iphonebackuptools/wiki/V4-Reports-List)

## Installing (as a module)
```bash
npm i ibackuptool --save
```

You can then import the module to run reports and get javascript objects as results:

```js
const bt = require('ibackuptool')

// Call the backups.list report.
bt.run('backups.list')
  .then(backups => {
    // Gives you a list of backups.
    console.log(backups)
  })
```

## Installing (as a global command line tool)

Prerequisites: [nodejs](https://nodejs.org/en/) and [npm](https://www.npmjs.com/). It's highly recommended using [nvm](https://github.com/nvm-sh/nvm) to install node/npm, as it makes it easier to install globally.

```bash
# Install directly from NPM
npm i -g ibackuptool
```
If you do not have permission to install globally, you can try something like [this](https://medium.com/@samfeolu/install-your-npm-packages-globally-without-sudo-in-3-steps-d62c96a76b89) to change your NPM prefix and add it into your $PATH. 

### CLI Quickstart

```bash
# List all the backups on the system
ibackuptool -l 

# I'm using "0c1bc52c50016933679b0980ccff3680e5831162" as a placeholder.
# The list of backups contains the different UDIDs in the first column.
UDID="0c1bc52c50016933679b0980ccff3680e5831162"

# Run ibackuptool --help to get a list of reports that are available
ibackuptool -b $UDID --report '$TYPE'
```

### Terminal Permissions (macOS)

If you receive an error when trying to list backups, then it is possible Terminal does not have permission to access the folder where backups are stored. Read the error message for the location, otherwise try to just list the backups manually:

```bash
# List all backups manually (macOS)
ls "/Users/$(whoami)/Library/Application Support/MobileSync/Backup"
```

You will see `ls: Operation not permitted` and know that Terminal does not have permission. Fix by allowing Terminal in Full Disk Access under Security & Privacy. First, close Terminal, and then:

`System Preferences -> Security & Privacy -> Privacy -> Full Disk Access -> + -> tick Terminal`

Restart Terminal and try again.

#### Multiple-Reporting

You can also provide a comma separated list of reports to generate. Additionally, there is a special `all` report type which will run all available reports. This is best paired with the `-o` option for saving to disk and the `-f` option for selecting a format such as CSV, or JSON.

```bash
# Run all phone reports and wifi report.
ibackuptool -b $UDID --report 'phone.*,system.wifi'

# Report all possible
ibackuptool -b $UDID --report all
```

### Reporting formats
iBackupTool now supports multiple kinds of data export, which can be selected using the `-f` flag.
- `table` - Selected data columns in an ascii table
- `html` - HTML file containing table with selected columns (same data as `table`)
- `json` - Selected data columns for display (same data as `table`)
- `csv` - CSV file containing selected columns (same data as `table`)

Additionally, there are more comprehensive export functions that will export ALL the data collected, and keep original formatting and columns:
- `raw-csv` - Full-data CSV export from each of the tables.
- `raw`, `raw-json` - Full-data JSON export from each of the tables. This output can be quite large.

#### Joined Reports
Additionally, for the `json` and `raw-json` types, there's a `--join-reports` flag which will merge all of the data into a single JSON file, where the top level object has a key for each report type that is selected.

```bash
# Generate both wifi and calls reports, joined as JSON
ibackuptool -b $UDID -r systme.wifi,phone.calls -f json --join-reports
```

### Output to disk
the `-o <path>` (`--output <path>`option specifies a folder to export reports to. If the directory does not exist, it will be created. For joined JSON reports, a single json file is exported instead of multiple files in a directory.

```bash
# Export wifi, calls, voicemail as CSV files to disk in a folder named "exported/"
ibackuptool -b $UDID --report system.wifi,phone.calls,phone.voicemail -f csv -o exported
```

## Extracting files
the `--extract <path>` parameter paired with the backup.files report will extract all files in a backup.

To limit which files are extracted, pass one or more filters via `--filter <filter>`.
Each filter must match for the file to be included.

Regular expression filters can be passed by `--regex-filter <filter>`.

```bash
# Export all JPEG photos onto "~/Desktop/Photos"
ibackuptool -b $UDID -r backup.files --extract ~/Desktop/Photos --filter DCIM --regex-filter '\.(jpg|JPG|jpeg|JPEG)$'
```

## Running Tests
first, install [tap](https://www.npmjs.com/package/tap)

next, run `npm test`.

## Important!
You should make a backup of the backups you look at using this tool, even though they are opened as read-only, you should still do that do you don't accidentally do something to lose data.

## Contributing
See [Contributing.md](Contributing.md)

## TODO
See [Roadmap](https://github.com/richinfante/iphonebackuptools/wiki/Roadmap-and-Vision)

## Legal

Copyright &copy; 2017-2019 Richard Infante.

Available under the MIT License.

**DISCLAIMER: This tool enables the extraction of personal information from iPhone backups located on a computer drive. The tool is for testing purposes and should ONLY be used on iPhone backups where the owner's consent has been given. Do not use this tool for illegal purposes, ever.**

**The project contributors and Richard Infante will not be held responsible in the event any criminal charges be brought against any individuals misusing this tool and/or the information contained within, to break the law.**



