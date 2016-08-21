let eventMessage = (user, action, repo, details) => `**${user} ${action}** in ${repo}\n${details}`

var events = {}

events.ping = (body) => {
    let user = body.sender.login
    let repo = body.repository.full_name
    let action = `sent a ping to this webhook`
    let details = `*${body.zen}*`

    return eventMessage(user, action, repo, details)
}

events.push = (body) => {
    let user = body.head_commit.author.username
    let repo = body.repository.full_name

    let pushed = body.forced ? 'force-pushed' : 'pushed'
    let num = body.commits.length
    let commits = (num === 1 ? 'commit' : 'commits')
    let branch = body.ref.replace('refs/heads/', '')
    let action = `${pushed} ${num} ${commits} to \`${branch}\``

    let details = body.commits.map(c => `**\`${c.id.substr(0,7)}\`** ${c.author.username}: ${c.message.split('\n')[0]}`).join('\n')

    return eventMessage(user, action, repo, details)
}

events.create = (body) => {
    let user = body.sender.login
    let repo = body.repository.full_name
    let action = `created branch \`${body.ref}\``

    return eventMessage(user, action, repo, '')
}

events.pull_request = body => {
    let user = body.sender.login
    let repo = body.repository.full_name
    var action = ''
    var details = ''

    switch (body.action) {
        case 'opened':
            action = `opened pull request #${body.number}`
            details = body.pull_request.body
            var trimmedDetails = details.split(/(\n|\r)/)[0]
            console.log(trimmedDetails)
            if (!(details === trimmedDetails)) details = trimmedDetails + ' [...]'
            details += `\n<${body.pull_request.html_url}>`
            break;
        default:
            // Other events are ignored
            return;
    }

    return eventMessage(user, action, repo, details)
}

module.exports = events
