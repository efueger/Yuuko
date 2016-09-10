let request = require('request')
let roll = require('./roll.js')

var commands = {}

commands.help = {
    name: 'help',
    desc: 'Gets help for a command. If not passed a command name, gets a list of all commands.',
    usage: '[command]',
    process: (c, msg, args) => {
        let response = c.getCommandHelp(msg, args)
        c.reply(msg, response)
    }
}

commands.ping = {
    name: 'ping',
    desc: 'Pings the bot',
    usage: '',
    process: (c, msg) => {
        c.reply(msg, "I'm here.")
    }
}

commands.request = {
    name: 'request',
    desc: 'Requests a URL and returns the response',
    usage: '[method] <uri>',
    process: (c, msg, args) => {
        // Get the arguments - the request URI and method
        if (!args) return c.reply(msg, '**Request failed.**\n Error: No URI specified')
        args = args.split(' ')
        var uri = args[1] ? args[1] : args[0]
        uri = uri.replace(/<([^>]+)>/, '$1') // Allow suppressed links
        var method = args[1] ? args[0] : 'get'
        console.log(method)
        method = method.toUppercase

        // Perform the request
        request({uri: uri, method: method}, (err, res, body) => {
            if (err) {
                c.reply(msg, '**Request failed.**\n' + err)
            } else {
                var reply = ''
                reply += `**\`${ res.statusCode } ${ res.statusMessage }\`** ← \`${ res.request.req.method } ${ res.request.href }\`\n`
                // Attempt to upload the body to PasteBin
                if (body) c.pastebinUpload('Response body', JSON.stringify(res, null, 4), null, (err, link) => {
                    if (err || !err) {
                        reply += 'There was an error uploading the response body to Pastebin.\n' + err
                        if (body.length <= 3000) {
                            reply += '\nBody:\n' + body
                        } else {
                            reply += '\nThe body is too long to fit in a message.'
                        }
                    } else {
                        reply += `Body paste: <${ link }>`
                    }
                    c.reply(msg, reply)
                })
                else c.reply(msg, reply)
            }
        })
    }
}

commands.npm = {
    name: 'npm',
    desc: 'Looks up a package on NPM.',
    usage: '<package>',
    process: (c, msg, args) => {
        c.reply(msg, `Looking up package \`${args}\`, please wait...`).then(reply => {
            request(`https://www.npmjs.com/package/${args}`, (err, res) => {
                if (res.statusCode === 200 && !err) {
                    c.editMessage(reply.channel.id, reply.id, `https://www.npmjs.com/package/${args}`)
                } else {
                    c.editMessage(reply.channel.id, reply.id, 'Package not found')
                }
            })
        })
    }
}

commands.roll = {
    name: 'roll',
    aliases: [ 'r' ],
    desc: 'Roll some dice.',
    usage: '<roll> [roll ...]',
    process: (c, msg, args) => {
        function constructMessage (results) {
            if (!results) return 'Invalid roll.' // If we can't access the results, the user probably fucked it up
            // Loop over each roll
            var response = ''
            for (let result of results) {
                response += `**\`${result.roll.string}\`** > ${result.error ? 'Roll was out of range; try something smaller.' : `**${result.total}**`}\n`
            }
            return response
        }

        let results = roll(args)
        c.reply(msg, constructMessage(results))
        return 'Rolled.'
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
