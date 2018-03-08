module.exports.name = 'conversations_full'
module.exports.description = 'List all SMS and iMessage conversations and their messages (dump only)'

// Specify this reporter requires a backup.
// The second parameter to func() is now a backup instead of the path to one.
module.exports.requiresBackup = true

// Specify this reporter supports the promises API for allowing chaining of reports.
module.exports.usesPromises = true

module.exports.func = async function (program, backup, resolve, reject) {
  // if (program.dump) {
  // return new Promise(async (resolve, reject) => {
  let conversations = await backup.getConversations()
  let conversations_full = []
  for (let el of conversations) {
    let messages = await backup.getMessages(el.ROWID, true)
    for (let message of messages) {
      message.conversation = el
      message.attachments = await backup.getMessageAttachments(message.ROWID)
    }
    conversations_full.push(...messages)
  }

  // Use the configured formatter to print the rows.
  const result = program.formatter.format(conversations_full, {
    // Color formatting?
    program: program,

    // Columns to be displayed in human-readable printouts.
    // Some formatters, like raw or CSV, ignore these.
    columns: {
      'conversation_id': el => el.conversation.ROWID,
      'date': el => el.conversation.XFORMATTEDDATESTRING || '??',
      'service': el => el.conversation.service_name + '',
      'chat_name': el => el.conversation.chat_identifier + '',
      'display_name': el => el.conversation.display_name + '',
      'message_id': el => el.ROWID + '',
      'content': el => el.text + '',
      'date': el => el.date + '',
      'date_read': el => el.date_read + '',
      'date_delivered': el => el.date_delivered + '',
      'is_delivered': el => el.is_delivered + '',
      'is_finished': el => el.is_finished + '',
      'is_from_me': el => el.is_from_me + '',
      'is_read': el => el.is_read + '',
      'is_sent': el => el.is_sent + '',
      'attachments': el => el.attachments.map((at) => at.filename)
    }
  })

  resolve(result)
}
