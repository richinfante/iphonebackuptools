# iPhone backup tools
Are _you_ storing unencrypted iPhone backups on your personal computer? With very little effort, we can dump *all* the saved messages from the backup, as well as contacts and other data.

Currently works on macOS, If someone wants to make the changes nessecary for windows, send a PR.

## Installing
clone this repo, then run:
```bash
npm install
```

## Usage
```bash
npm start
```

- You should make a backup of the backups you look at using this tool, even though they are opened as read-only, you should still do that do you don't accidentally do something to lose data.

## TODO
- Contact name lookup for newer iOS10 backups
