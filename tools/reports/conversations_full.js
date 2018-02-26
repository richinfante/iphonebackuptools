module.exports.name = 'conversations_full'
module.exports.description = 'List all SMS and iMessage conversations and their messages (dump only)'

// Specify this reporter requires a backup. 
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = async function (program, backup, resolve, reject) {
  //if (program.dump) {
    //return new Promise(async (resolve, reject) => {
    let conversations = await backup.getConversations();
    for (let el of conversations) {
      el.messages = await backup.getMessages(el.ROWID, true);
    }

      // Use the configured formatter to print the rows.
    const result = program.formatter.format(conversations, {
      // Color formatting?
      program: program,

      // Columns to be displayed in human-readable printouts.
      // Some formatters, like raw or CSV, ignore these.
      columns: {
        'ID': el => el.ROWID,
        'Date': el => el.XFORMATTEDDATESTRING || '??',
        'Service': el => el.service_name + '',
        'Chat Name': el => el.chat_identifier + '',
        'Display Name': el => el.display_name + '',
      }
    })
      
    resolve(conversations);
    //});
  /*} 
  else {
    backup.getConversations(program.dump)
      .then((items) => {
        items = items.map(el => [
          el.ROWID + '',
          chalk.gray(el.XFORMATTEDDATESTRING || '??'),
          el.service_name + '', 
          el.chat_identifier + '',
          el.display_name + ''
        ])

        items = [['ID', 'DATE', 'Service', 'Chat Name', 'Display Name'], ['-', '-', '-', '-', '-'], ...items]
        items = normalizeCols(items).map(el => el.join(' | ')).join('\n')

        if (!program.color) { items = stripAnsi(items) }

        console.log(items)
      })
      .catch((e) => {
        console.log('[!] Encountered an Error:', e)
      })
  }*/
}
