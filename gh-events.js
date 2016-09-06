let request = require('request')

function trim (message) {
    var trimmed = message.split(/(\n|\r)/)[0]
    if (!(trimmed === message)) message = trimmed + ' [...]'
    return message
}

function shortenUrl (url, callback) {
    request.post('https://git.io', {form: {url: url}}, (err, res) => {
        if (err) callback(err)
        else callback(null, res.headers.location)
    })
}

var events = {}

events.ping = (body, callback) => {
    callback(null, `**${body.sender.login} pinged the webhook** from ${body.repository.full_name}\n${body.zen}`)
}

events.push = (body, callback) => {
    if (!(body.ref.split('/')[1] === 'heads')) return
    let details = body.commits.map(c => `**\`${c.id.substr(0,7)}\`** ${c.author.username}: ${c.message.split('\n')[0]}`).join('\n')
    callback(null, `**${body.sender.login} ${body.forced ? 'force-' : ''}pushed ${body.commits.length} commit${body.commits.length > 1 ? 's' : ''} to \`${body.ref.split('/').pop()}\`** in ${body.repository.full_name}\n${details}`)
}

events.create = (body, callback) => {
    callback(null, `**${body.sender.login} created ${body.ref_type} ${body.ref}** in ${body.repository.full_name}`)
}

events.commit_comment = (body, callback) => {
    if (!body.action === 'created') return
    shortenUrl(body.comment.html_url, (err, url) => {
        callback(err, `**${body.sender.login} commented on commit \`${body.comment.commit_id.substr(0,7)}\`** in ${body.repository.full_name}\n${trim(body.comment.body)}\n<${url}>`)
    })
}

events.pull_request = (body, callback) => {
    // let user = body.sender.login
    // let repo = body.repository.full_name
    // var action = ''
    // var details = ''

    switch (body.action) {
        case 'opened':
            shortenUrl(body.pull_request.html_url, (err, url) => {
                callback(err, `**${body.sender.login} opened pull request #${body.number}** in ${body.repository.full_name}\n${trim(body.pull_request.body)}\n<${url}>`)
            })
            break
        default:
            // Other events are ignored
            return
    }
}

module.exports = events
