let request = require('request')

module.exports = {
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
