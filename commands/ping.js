module.exports = {
    name: 'ping',
    desc: 'Pings the bot',
    usage: '',
    process: (c, msg) => {
        c.reply(msg, "I'm here.")
    }
}