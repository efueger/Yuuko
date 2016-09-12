module.exports = {
    name: 'listtags',
    desc: 'Lists all tags.',
    usage: '',
    aliases: [ 'lt', 'tag-list' ],
    process: (c, msg) => {
        // No PM channels
        if (!msg.channel.guild) return c.reply(msg, "Sorry, can't be used in PM.")

        // Get the current tags
        let tags = c.rawGuildConfig(msg.channel.guild.id).tags || {}

        // Create list of tags
        let names = Object.keys(tags).map(n=>'`'+n+'`').join(', ')

        // Return the list
        c.reply(msg, names)
    }
}
