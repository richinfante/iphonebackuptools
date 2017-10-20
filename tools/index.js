const backup = require('./util/iphone_backup')
const inquirer = require('inquirer')
const chalk = require('chalk')

async function main() {
  try {
  var backups = await backup.availableBackups()

  var result = await inquirer.prompt({
    type: 'list',
    name: 'backupid',
    message: 'Select Backup:',
    choices: backups.map(el => {
      console.log(el)
      return {
        name: el.manifest ? 
          `${el.manifest.Lockdown.DeviceName} <${el.id}> ${el.status ? new Date(el.status.Date).toLocaleString() : ''}` : 
          `Unknown Device ${el.id} ${el.status ? new Date(el.status.Date).toLocaleString() : ''}`,
        value: el.id
      }
    })
  })
  
  const selectedBackup = backup.iPhoneBackup.fromID(result.backupid)
  
  const conversations = await selectedBackup.getConversations()

  var conversation = await inquirer.prompt({
    type: 'list',
    name: 'chat_id',
    message: 'Select Conversation:',
    choices: conversations.map(el => {
      return {
        name: chalk.gray(el.date ? el.date.toLocaleString() : '??') + ' ' + el.display_name + ' ' +  el.chat_identifier,
        value: el.ROWID
      }
    })
  })

  //console.log(conversation)

  const messages = await selectedBackup.getMessages(conversation.chat_id)
  console.log(
    messages.map(el => chalk.gray(el.date ? el.date.toLocaleString() : '') + ' ' + chalk.blue(el.sender + ': ') + el.text)
    .join('\n')
  )
  } catch(e) {
    console.log(e)
  }
}

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
})

try {
  main()
} catch (e) {
  console.log(e)
}