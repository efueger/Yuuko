// Global bot info (token, etc)
let config = require('./config.json')

// Reloadable configs and stuff
let guilds = require('./guilds.json')
let commands = require('./commands.js')
let ghEvents = require('./gh-events.js')

// Packages
let fs = require('fs')
let reload = require('require-reload')(require)
let chalk = require('chalk')
let merge = require('merge')
let Eris = require('eris')
let express = require('express')
let bodyParser = require('body-parser')
let pastebinApi = require('pastebin-js')

// Package artifacts
let c = new Eris.Client(config.token)
let server = express().use(bodyParser.json())
let pastebin = new pastebinApi(config.apiKeys.pastebin)


/// Some convenience functions, extending the client so commands can use them easily ///


// Replies to a message, just a shorthand for createMessage
c.reply = (msg, content, file) => c.createMessage(msg.channel.id, content, file) // Reply to a message directly

// Reload some stuff via the reload module
c.reloadGuilds = () => guilds = reload('./guilds.json') // Reload the guild config
c.reloadCommands = () => commands = reload('./commands.js') // Reload the bot's commands
c.reloadGhEvents = () => ghEvents = reload('./gh-events.js') // Reload the GitHub webhook events

// Check whether or not the author of a message is the owner of the bot; if not, send a permission error message
c.requireOwner = (msg) => {
    let result = config.ownerIds.includes(msg.author.id)
    if (!result) c.reply(msg, 'Sorry, gotta be an owner to do that.')
    return result
}

// Get the computed config of a guild by merging its local config with the global defaults
c.getGuildConfig = guildId => merge(config.guildDefaults, guilds[guildId] || {})

// Get the raw config of a guild for modification
c.rawGuildConfig = guildId => guilds[guildId] || {}

// Updates a guild's local config with the specified options
c.writeGuildConfig = (guildId, options) => {
    // Compute new config
    let guildConfig = guilds[guildId] || {}
    guildConfig = merge(guildConfig, options)
    let newStuff = {}
    newStuff[guildId] = guildConfig

    // Update the global variable to make changes take effect
    guilds = merge(guilds, newStuff)

    // Write to file to make the changes permanent
    fs.writeFile('guilds.json', JSON.stringify(guilds), 'utf-8', err => {
        if (err) console.log(err)
        c.reloadCommands()
    })
}
// Returns the prefix appropriate to check for in the context of a message
c.getPrefixFromMessage = msg => {
    // If it's in a guild, then return the guild's prefix
    if (msg.channel.guild) return c.getGuildConfig(msg.channel.guild.id).prefix

    // Otherwise, return the default
    return config.guildDefaults.prefix
}

c.getCommandHelp = (msg, commandName) => {
    // Get a formatted help message for a command

    // Parsing stuff
    let prefix = c.getPrefixFromMessage(msg)
    if (commandName.startsWith(prefix)) commandName = commandName.substr(prefix.length)

    // Alias processing
    commandName = commands._aliases[commandName] || commandName
    let command = commands[commandName]
    if (!command) {
        // Return a list of all commands
        var list = Object.keys(commands)
            .filter(c => !commands[c].hide) // Hide commands from the list if their hide attribute is set
            .filter(c => !(c==='_aliases')) // The aliases map doesn't count
            .map(c => '`' + prefix + c + '`')
            .join(', ')
        list = `**Command list:**\n${list}\n*Use \`${prefix}help [command]\` for more info about that command.*`
        return list
    } else {
        // Return help for this specific command
        var response = ''
        response += `**Command help: \`${prefix + command.name}\`**\n`
        response += `**Description:** ${command.desc || '*No description provided.*'}\n`
        response += `**Usage:** \`${prefix + commandName} ${command.usage}\`\n`
        response += command.aliases ? `**Aliases:** ${command.aliases.map(a=>'`'+prefix+a+'`').join(', ')}` : ''
        return response
    }
}

// Upload some text to pastebin with the default settings for the bot
c.pastebinUpload = (title, content, format, callback) => {
    pastebin.createPaste({
        title: title,
        text: content,
        format: format,
        privacy: 1,
        expires: 'N'
    }).then(pasteId =>
        callback(null, `http://pastebin.com/${pasteId}`)
    ).fail(callback)
}

// Eval command - moved here because I don't like having this in the command scope
c.eval = (msg, code) => {
    // Some eval-specific utilities that I call a lot
    let guildList = c.guilds.map(guild => `\`${guild.id}\` ${guild.name}`).join('\n') // eslint-disable-line no-unused-vars
    // The actual eval now
    let result
    try {
        result = eval(code) // eslint-disable-line no-eval
    } catch (e) {
        result = e
    }
    c.reply(msg, result)
}


/// Now for the actual things ///


// GitHub webhook actions
server.post('/ghweb', (req, res) => {
    // Get and validate the server that this message should go to
    let guildId = req.query.server
    if (!guildId) return res.status(400).send('No server specified')
    let guild = c.guilds.find(g => g.id === guildId)
    if (!guild) return res.status(400).send('Could not find specified server')

    // Start processing the webhook for that server
    let channel = c.getGuildConfig(guildId).githubChannel || guild.defaultChannel.id
    let e = req.headers['x-github-event']

    // Does this event exist?
    if (ghEvents[e]) {
        // Yeah, let's get the event message and then send it
        ghEvents[e](req.body, (err, response) => {
            if (err) {
                res.status(500).send('Random internal error, rip')
            } else {
                c.createMessage(channel, response)
                res.status(200).send(response)
            }
        })
    } else {
        // Nope, yet another error here
        res.status(501).send('No action for this event was found')
    }
})
server.listen(3000)
console.log('GitHub webhook server running on port 3000.')

// Bot actions
c.once('ready', () => {
    // Ready log
    console.log(`Connected to Discord as ${chalk.green(c.user.username+'#'+c.user.discriminator)} / Connected to ${c.guilds.size} guilds`)
})
c.on('messageCreate', msg => {
    // Get active prefix
    let prefix = c.getPrefixFromMessage(msg)

    // If the message doesn't start with the right prefix, it's not a command
    if (!msg.content.startsWith(prefix)) return

    // Remove the prefix, split on spaces, pop first to command name, join rest as args string
    let split = msg.content.substr(prefix.length).split(' ')
    let commandName = split.splice(0, 1)
    let args = split.join(' ')

    // Attempt to convert the command from an alias to an actual command
    commandName = commands._aliases[commandName] || commandName

    // If the command isn't a thing, go home
    if (!commands[commandName]) return

    // Fancy logs
    if (msg.channel.guild) {
        console.log(`${chalk.magenta(msg.channel.guild.name)} \u00BB ${chalk.blue(msg.channel.name)} \u00BB ${chalk.green(msg.author.username)} ${msg.content}`)
    } else {
        console.log(`${chalk.magenta('PM channel')} ${chalk.green(msg.author.username)} ${msg.content}`)
    }

    // oh right we have to actually execute it i forgot that part
    commands[commandName].process(c, msg, args)
})
c.connect()
