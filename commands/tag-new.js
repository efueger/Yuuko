module.exports = {
    name: 'newtag',
    desc: 'Creates a new tagged snippet for use with the tag command. Tag name cannot contain spaces.',
    usage: '<name> <text ...>',
    aliases: [ 'nt' ],
    process: (c, msg, args) => {
        // No PM channels
        if (!msg.channel.guild) return c.reply(msg, "Sorry, can't be used in PM.")

        // Parse args into tag name (first word) and tag content (all other words)
        args = args.split(' ')
        let name = args.splice(0, 1)
        let content = args.join(' ')

        // Get the current tags
        let tags = c.rawGuildConfig(msg.channel.guild.id).tags || {}

        // Don't allow duplicate tags
        if (tags[name]) return c.reply(msg, 'Sorry, a tag by that name already exists.')

        // Write the new tag to the object
        tags[name] = {
            content: content,
            author: msg.author, // just want to say that I love that I can do this
            timestamp: Date.now()
        }

        // Write the object back into guild config
        c.writeGuildConfig(msg.channel.guild.id, { tags: tags })
        c.reply(msg, `${msg.member.nick || msg.author.username} created the tag ${name}`)
    }
}
