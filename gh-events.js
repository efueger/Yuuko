let eventMessage = (user, action, repo, details) => `**${user}** ${action} in ${repo}\n${details}`

var events = {}

events.ping = (body, c, guild) => {
    res.send(req.body.zen)
    return `**Recieved ping from GitHub webhook.**\n*${req.body.zen}*`
}

events.push = (body, c, guild) => {
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

module.exports = events
