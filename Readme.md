# iPhone backup tools

[![Build Status](https://travis-ci.org/richinfante/iphonebackuptools.svg?branch=master)](https://travis-ci.org/richinfante/iphonebackuptools)
[![npm](https://img.shields.io/npm/v/ibackuptool.svg)](http://npmjs.com/ibackuptool)
![license](https://img.shields.io/github/license/richinfante/iphonebackuptools.svg)

Are _you_ storing unencrypted iPhone backups on your personal computer? With very little effort, we can dump **all** the saved messages from the backup, as well as notes, photo locations, and other data. 

Check out my recently updated post about my work on backups here: [Reverse Engineering the iOS Backup](https://www.richinfante.com/2017/3/16/reverse-engineering-the-ios-backup)

**This tool is also still fairly experimental, so use at your own risk! Even though the tool opens the backup files as read-only, you should still make a copy of your backups before using this if they are important.**

Currently works on macOS, not tested on windows but should work on windows by setting the attribute `--dir` to the backups directory location.

## iOS Support
iOS Support depends on the individual reporting types and which files are specifically present inside of the backup. When a report type is not supported, an error message is outputted to the terminal. Some reports, such as the manifest report, support iOS versions as early as iOS 5 to the latest iOS (iOS 11 as of this writing).

## Installing

```bash
# Install directly from NPM
npm i -g ibackuptool

# If you prefer, you can do this manually:
# Clone this repo, then run:
# Install Globally on your system.
npm i -g 

# Or, If you really want:
# Clone this repo, then run: 
npm install
run `node tools/index.js` # use this instead of ibackuptool
```

### Usage
```bash
# List all the backups on the system
ibackuptool -l 

# I'm using "0c1bc52c50016933679b0980ccff3680e5831162" as a placeholder.
# The list of backups contains the different UDIDs in the first column.
UDID="0c1bc52c50016933679b0980ccff3680e5831162"
```

### Reports
- run using `ibackuptool -b <udid> --report <type>`
- Current types:
    - `apps` - List all installed applications and container IDs.
    - `calls` - List all call records contained in the backup.
    - `calls-statistics` List call statistics
    - `conversations` - List all SMS and iMessage conversations
    - `conversations_full` - Output raw message contents along with conversations. Requires `-f raw-json` or `--dump`.
    - `cookies` - List cookie domains for all apps
    - `list` - List of all backups. alias for `-l`. Does not require the `-b` flag.
    - `manifest` - List all the files contained in the backup (iOS 10+)
    - `messages` - List all SMS and iMessage messages in a conversation. This requires using the `--id` flag to specify a conversation to inspect.
    - `notes` - List all iOS notes
    - `oldnotes` - List all iOS notes (from older unused database)
    - `photolocations` - List all geolocation information for iOS photos (iOS 10+)
    - `voicemail-files` - List all or extract voicemail files (iOS 10+)
    - `voicemail` - List all or extract voicemails on device
    - `webhistory` - List all web history
    - `wifi` - List associated wifi networks and their usage information

```bash
# Using a UDID from the previous step, now you can run:
# List Installed Apps
ibackuptool -b $UDID --report apps

# List Recent Web History
ibackuptool -b $UDID --report webhistory

# List Recent Photos Geolocations (iOS 10+)
ibackuptool -b $UDID --report photolocations

# List iOS Notes
ibackuptool -b $UDID --report notes

# List iOS Notes from old database that may exist
ibackuptool -b $UDID --report oldnotes

# List calls
ibackuptool -b $UDID --report calls

# List voicemails 
ibackuptool -b $UDID --report voicemail

# List voicemail files (iOS 10+)
ibackuptool -b $UDID --report voicemail-files

# Export voicemail files (iOS 10+)
ibackuptool -b $UDID --report voicemail-files --export ./ExportedVoicemails

# List wifi networks 
ibackuptool -b $UDID --report wifi

# Extract all files into a new directory called "BACKUP"
ibackuptool -b $UDID --report manifest --extract BACKUP --filter all

# Extract all Camera Roll data into a new directory called "BACKUP".
# See the wiki for additonal info about filtering.
ibackuptool -b $UDID --report manifest --extract BACKUP --filter CameraRollDomain
```

### Messages Access

```bash
# List of all conversations, indexed by ID.
# Each row starts with an ID number, which is needed for the next step.
ibackuptool -b $UDID -r conversations

# Now, Fetch the messages with the following command
# Replace $CONVERSATION_ID with a row ID from `ibackuptool -b $UDID -r conversations`
ibackuptool -b $UDID -r messages --id $CONVERSATION_ID
```

### Reporting formats
iBackupTool now supports multiple kinds of data export:
- `table` - Selected data columns in an ascii table
- `json` - Selected data columns for display (same data as `table`)
- `csv` - CSV file containing selected columns (same data as `table`)

Additionally, there are more comprehensive export functions that will export ALL the data collected, and keep original formatting and columns:
- `raw-csv` - Full-data CSV export from each of the tables.
- `raw`, `raw-json` - Full-data JSON export from each of the tables. This output can be quite large.

#### Multiple-Reporting 
You can also provide a comma separated list of reports to generate. Additionally, there is a special `all` report type which will run all available reports. This is best paired with the `-o` option for saving to disk and the `-f` option for selecting a format such as CSV, or JSON.

```bash
# Report wifi, calls, voicemail
ibackuptool -b $UDID --report wifi,calls,voicemail

# Report all possible
ibackuptool -b $UDID --report all
```

#### Joined Reports
Additionally, for the `json` and `raw-json` types, there's a `--join-reports` flag which will merge all of the data into a single JSON file, where the top level object has a key for each report type that is selected.

```bash
# Generate both wifi and calls reports, joined as JSON
ibackuptool -b $UDID -r wifi,calls -f json --join-reports
```

### Output to disk
the `-o <path>` (`--output <path>`option specifies a folder to export reports to. If the directory does not exist, it will be created. For joined JSON reports, a single json file is exported instead of multiple files in a directory.

```bash
# Export wifi, calls, voicemail as CSV files to disk in a folder named "exported/"
ibackuptool -b $UDID --report wifi,calls,voicemail -f csv -o exported
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

Copyright &copy; 2017-2018 Richard Infante.

Available under the MIT License.

**DISCLAIMER: This tool enables the extraction of personal information from iPhone backups located on a computer drive. The tool is for testing purposes and should ONLY be used on iPhone backups where the owner's consent has been given. Do not use this tool for illegal purposes, ever.**

**The project contributors and Richard Infante will not be held responsible in the event any criminal charges be brought against any individuals misusing this tool and/or the information contained within, to break the law.**



