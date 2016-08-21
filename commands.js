let request = require('request')

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
    process: (c, msg, args) => {
        c.reply(msg, "I'm here.")
    }
}

commands.request = {
    name: 'request',
    desc: 'Requests a URL and returns the response',
    usage: '[method] <url>',
    process: (c, msg, args) => {
        // Get the arguments - the request URI and method
        if (!args) return c.reply(msg, '**Request failed.**\n' + err)
        args = args.split(' ')
        var uri = args[1] ? args[1] : args[0]
        uri = uri.replace(/<([^>]+)>/, '$1') // Allow suppressed links
        var method = args[1] ? args[0] : 'get'
        method = method.toUppercase

        // Perform the request
        request({uri: uri, method: method}, (err, res, body) => {
            if (err) {
                c.reply(msg, '**Request failed.**\n' + err)
            } else {
                var reply = ''
                reply += `**\`${ res.statusCode } ${ res.statusMessage }\`** ← \`${ res.request.req.method } ${ res.request.href }\`\n`
                // Attempt to upload the body to PasteBin
                c.pastebinUpload('Response body', JSON.stringify(res, null, 4), null, (err, link) => {
                    if (err || !err) {
                        reply += 'There was an error uploading the response body to Pastebin.\n' + err.message
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
            }
        })
    }
}

commands.prefix = {
    name: 'prefix',
    desc: 'Changes the server prefix',
    usage: '<prefix>',
    process: (c, msg, args) => {
        if (!msg.channel.guild) return c.reply(msg, "Can't use that in PM channels.")
        if (false) return c.reply(msg, 'kjasdf') // todo: perm check here
        if (/[a-zA-Z0-9\s\n]/.test(args)) return c.reply(msg, "Prefix cannot contain letters, numbers, newlines, or whitespace.")
        c.writeGuildConfig(msg.channel.guild.id, {prefix: args})
        c.reply(msg, `Updated prefix to ${args}`)
    }
}

commands.reload = {
    name: 'reload',
    desc: 'Reloads all commands. Must be an owner to use this command.',
    usage: '',
    hide: true,
    process: (c, msg, args) => {
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

commands.setavatar = {
    name: 'setavatar',
    desc: "Set the bot's avatar",
    usage: '<url or file upload>',
    hide: true,
    process: (c, msg, args) => {
        if (c.requireOwner(msg)) {
            // Get the URL of the image
            let url = args.split(" ")[0] // URL specified in chat
            if (msg.attachments[0]) url = msg.attachments[0].url // URL specified by upload
            url = url.replace(/<([^>]+)>/, '$1') // Allow suppressed URLs
            if (url === "") return c.reply(msg, 'No image was uploaded or linked.') // Return if no URL
            // Get the image itself by requesting the URL
            request.get({url: url, method: 'GET', encoding: null}, (err, res, body) => {
                // Handle possible errors
                if (err) return c.reply(msg, 'Error while retrieving avatar: ' + err)
                else if (res.statusCode !== 200) return c.reply(msg, `Got non-200 response (${res.statusCode} ${res.statusMessage}) while retrieving avatar`)
                // Edit the avatar
                c.editSelf({
                    avatar: `data:${res.headers['content-type']};base64,${body.toString('base64')}`
                }).then(user => {
                    c.reply(msg, 'Avatar updated!')
                }).catch(err => {
                    c.reply(msg, 'There was an error while uploading the new avatar.')
                })
            })
        }
    }
}

module.exports = commands
