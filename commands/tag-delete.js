module.exports = {
    name: 'deletetag',
    desc: 'Deletes a tagged snippet you authored.',
    usage: '<name>',
    aliases: [ 'dt', 'tag-delete' ],
    process: (c, msg, args) => {
        // No PM channels
        if (!msg.channel.guild) return c.reply(msg, "Sorry, can't be used in PM.")

        // Get the current tags
        let tags = c.rawGuildConfig(msg.channel.guild.id).tags || {}

        // Confirm the tag exists
        if (!tags[args]) return c.reply(msg, "Sorry, but there's no tag by that name.")

        // Compare the tag's owner to the message author
        if (!tags[args].author.id === msg.author.id) return c.reply(msg, "Sorry, that's not your tag.")

        // Remove the tag from the things
        delete tags[args]

        // Write the object back into guild config
        c.writeGuildConfig(msg.channel.guild.id, { tags: tags })
        c.reply(msg, `${msg.member.nick || msg.author.username} deleted the tag ${args}`)
    }
}
