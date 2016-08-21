let config = require('./config.json')
let commands = require('./commands.js')
let events = require('./gh-events.js')

let reload = require('require-reload')(require)
let chalk = require('chalk')
let Eris = require('eris'),
    c = new Eris.Client(config.token)
let express = require('express'),
    bodyParser = require('body-parser'),
    server = express().use(bodyParser.json())
let pastebinApi = require("pastebin-js"),
    pastebin = new pastebinApi(config.apiKeys.pastebin)

// Temp global declaration until I'm not lazy and move it to a per-guild config
var prefix = '~'

// Some convenience functions, extending the client so commands can use them easily (client is passed to commands)
c.reply = (msg, content, file) => c.createMessage(msg.channel.id, content, file) // Reply to a message directly
c.reloadCommands = () => commands = reload('./commands.js') // Reload the bot's commands
c.getPrefixFromMessage = msg => {
    if (msg.channel.guild) {
        return guilds[msg.channel.guild.id].prefix
    }
}
c.getCommandHelp = (commandName) => { // Get a formatted help message for a command
    if (commandName.startsWith(prefix)) commandName = commandName.substr(prefix.length)
    var command = commands[commandName]
    if (!command) {
        // Return a list of all commands
        var list = Object.keys(commands)
            .filter(c => !commands[c].hide) // Hide commands from the list if their hide attribute is set
            .map(c => '`' + prefix + c + '`')
            .join(', ')
        list = `**Command list:**\n${ list }\n*Use ~help <command> for more info about that command.*`
        return list
    } else {
        // Return help for this specific command
        var response = ''
        response += `**Command help: \`${ prefix + command.name }\`**\n`
        response += `**Description:** ${ command.desc || '*No description provided.*' }\n`
        response += `**Usage:** \`${ prefix + commandName } ${ command.usage }\`\n`
        return response
    }
}
c.pastebinUpload = (title, content, format, callback) => { // Creates a paste; calls back with the link
    pastebin.createPaste({
        title: title,
        text: content,
        format: format,
        privacy: 1,
        expires: 'N'
    }).then(pasteId =>
        callback(null, `http://pastebin.com/${ pasteId }`)
    ).fail(callback)
}

// GitHub webhook actions
server.post('/ghweb', (req, res) => {
    let guildId = req.query.server
    if (!guildId) return res.status(400).send('No server specified')
    let guild = c.guilds.find(g => g.id === guildId)
    if (!guild) return res.status(400).send('Could not find specified server')
    let e = req.headers['x-github-event']
    if (events[e]) {
        let response = events[e](req.body, c, guild)
        let channel = guild.defaultChannel.id
        c.createMessage(channel, response)
        res.status(200).send(response)
    } else {
        res.status(501).send('No action for this event was found')
    }
})
server.listen(3000)
console.log('GitHub webhook server running on port 3000.');

// Bot actions
c.on('ready', () => {
    console.log('Discord bot connected.');
})
c.on('messageCreate', msg => {
    // Commands
    if (msg.content.startsWith(prefix)) {
        var split = msg.content.substr(prefix.length).split(' ')
        var commandName = split.splice(0, 1)
        var args = split.join(' ')
        if (!commands[commandName]) return;
        if (msg.channel.guild) {
            console.log(`${ chalk.magenta(msg.channel.guild.name) } ${ chalk.blue(msg.channel.name) } ${ chalk.green(msg.author.username) } ${ msg.content }`)
        } else {
            console.log(`${ chalk.magenta('PM channel') } ${ chalk.green(msg.author.username) } ${ msg.content }`)
        }
        commands[commandName].process(c, msg, args)
    }
})
c.connect()
