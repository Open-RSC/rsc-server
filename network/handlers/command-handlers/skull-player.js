module.exports.name = 'skull'

module.exports.handle = (player, playerName, skullDuration) => {
    if (!playerName | !skullDuration) {
        return player.send.message('invalid command parity')
    }

    const targetPlayer = player.session.server.findPlayer(playerName)

    if (!targetPlayer) {
        return player.send.message(`player @yel@${playerName} @whi@ was not found`)
    }

    try {
        const duration = +skullDuration
        targetPlayer.skull = duration
    } catch (_) {
        player.send.message(`invalid skull duration`)
    }
}