module.exports = {
    name: 'tag',
    desc: 'Displays a tagged text snippet.',
    usage: 'tag <name>',
    aliases: [ 't' ],
    process: (c, msg, args) => {
        // No PM channels
        if (!msg.channel.guild) return c.reply(msg, "Sorry, can't be used in PM.")

        // Get the current tags config
        let tags = c.rawGuildConfig(msg.channel.guild.id).tags || {}

        // Make sure there isn't a tag there already
        if (!tags[args]) return c.reply(msg, 'No tag found with that name.')

        // Reply with the data of the relevant tag's config
        c.reply(msg, tags[args].content)
    }
}
