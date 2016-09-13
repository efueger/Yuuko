let request = require('request')
let roll = require('./roll.js')
let glob = require('glob')
let reload = require('require-reload')(require)

var commands = {}

// Load custom commands from the commands directory
let commandFiles = glob.sync('commands/*.js')
for (let filename of commandFiles) {
    try {
        // Load up the file
        let thisCommand = reload(`./${filename}`)

        // If the loaded command has no name or process, throw, since those are required
        if (!(thisCommand.name && thisCommand.process)) throw new Error('Missing name or process')

        // Set the command up to be exported if nothing bad happened
        commands[thisCommand.name] = thisCommand
    } catch (e) {
        // Log the error; don't add the command to be exported
        console.log(`Error while loading command from ${filename}:\n${e}`)
    }
}

commands.help = {
    name: 'help',
    aliases: [ 'h', '?', 'halp' ],
    desc: 'Gets help for a command. If not passed a command name, gets a list of all commands.',
    usage: '[command]',
    process: (c, msg, args) => {
        let response = c.getCommandHelp(msg, args)
        c.reply(msg, response)
    }
}

commands.prefix = {
    name: 'prefix',
    desc: 'Changes the server prefix',
    usage: '<prefix>',
    process: (c, msg, args) => {
        if (!msg.channel.guild) return c.reply(msg, "Can\'t use that in PM channels.")
        // if (false) return c.reply(msg, 'kjasdf') // todo: perm check here
        if (/[a-zA-Z0-9\s\n]/.test(args)) return c.reply(msg, 'Prefix cannot contain letters, numbers, newlines, or whitespace.')
        c.writeGuildConfig(msg.channel.guild.id, {prefix: args})
        c.reply(msg, `Updated prefix to ${args}`)
    }
}

commands.reload = {
    name: 'reload',
    desc: 'Reloads all commands. Must be an owner to use this command.',
    usage: '',
    hide: true,
    process: (c, msg) => {
        if (c.requireOwner(msg)) {
            c.reloadCommands()
            c.reloadGhEvents()
            c.reply(msg, 'Reloaded commands and GitHub event messages.')
        }
    }
}

commands.eval = {
    name: 'eval',
    desc: 'Evaluate raw JavaScript from the bot process.',
    usage: '<code ...>',
    hide: true,
    process: (c, msg, args) => {
        if (c.requireOwner(msg)) c.eval(msg, args)
    }
}

commands.setname = {
    name: 'setname',
    desc: "Set the bot's username",
    usage: '<name>',
    hide: true,
    process: (c, msg, args) => {
        if (c.requireOwner(msg)) {
            c.editSelf({username: args}).then(() => {
                c.reply(msg, 'Username updated!')
            }).catch(() => {
                c.reply(msg, 'There was an error while changing username.')
            })
        }
    }
}

commands.setavatar = {
    name: 'setavatar',
    desc: "Set the bot's avatar",
    usage: '<url or file upload>',
    hide: true,
    process: (c, msg, args) => {
        if (c.requireOwner(msg)) {
            // Get the URL of the image
            let url = args.split(' ')[0] // URL specified in chat
            if (msg.attachments[0]) url = msg.attachments[0].url // URL specified by upload
            url = url.replace(/<([^>]+)>/, '$1') // Allow suppressed URLs
            if (url === '') return c.reply(msg, 'No image was uploaded or linked.') // Return if no URL
            // Get the image itself by requesting the URL
            request.get({url: url, method: 'GET', encoding: null}, (err, res, body) => {
                // Handle possible errors
                if (err) return c.reply(msg, 'Error while retrieving avatar: ' + err)
                else if (res.statusCode !== 200) return c.reply(msg, `Got non-200 response (${res.statusCode} ${res.statusMessage}) while retrieving avatar`)
                // Edit the avatar
                c.editSelf({
                    avatar: `data:${res.headers['content-type']};base64,${body.toString('base64')}`
                }).then(() => {
                    c.reply(msg, 'Avatar updated!')
                }).catch(() => {
                    c.reply(msg, 'There was an error while uploading the new avatar.')
                })
            })
        }
    }
}

// This is just a generated object of all the aliases mapped to their respective commands
let aliases = {}
for (let command of Object.keys(commands)) {
    if (commands[command].aliases) {
        for (let alias of commands[command].aliases) {
            aliases[alias] = command
        }
    }
}
commands._aliases = aliases

module.exports = commands
