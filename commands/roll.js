let roll = require('../roll.js')

module.exports = {
    _name: 'roll',
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
