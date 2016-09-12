let request = require('request')

module.exports = {
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
