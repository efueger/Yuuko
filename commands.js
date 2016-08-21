let config = require('./config.json') // Need this for owner checks
let request = require('request')

var commands = {}

commands.help = {
    name: 'help',
    desc: 'Gets help for a command. If not passed a command name, gets a list of all commands.',
    usage: '[command]',
    process: (c, msg, args) => {
        let response = c.getCommandHelp(args)
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

commands.reload = {
    name: 'reload',
    desc: 'Reloads all commands. Must be an owner to use this command.',
    usage: '',
    hide: true,
    process: (c, msg, args) => {
        if (config.ownerIds.includes(msg.author.id)) {
            c.reloadCommands()
            c.reply(msg, 'Reloaded commands.')
        } else {
            c.reply(msg, "Sorry, gotta be an owner to do that.")
        }
    }
}

module.exports = commands
