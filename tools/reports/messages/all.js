
module.exports = {
  version: 4,
  name: 'messages.all',
  description: `List all SMS and iMessage conversations, nesting items. This may be SLOW, it is recommended you use a JSON formatter along with this.`,
  requiresBackup: true,

  // Available fields.
  output: {
    id: el => el.id,
    date: el => el.date,
    service: el => el.service,
    chatName: el => el.chatName,
    displayName: el => el.displayName,
    messages: el => el.messages // see messages.messages report!
  },

  // Run on a v3 lib / backup object.
  run (lib, { backup }) {
    return new Promise(async (resolve, reject) => {
      try {
        let conversations = await lib.run('messages.conversations', { backup })

        for (var conversation of conversations) {
          conversation.messages = await lib.run('messages.messages', {
            backup,
            id: conversation.id
          })
        }

        resolve(conversations)
      } catch (e) {
        reject(e)
      }
    })
  }
}
