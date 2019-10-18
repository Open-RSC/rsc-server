module.exports = player => {
    player.on('sprites', () => {
        for (const p of player.players.known) {
            p.playerUpdates.appearance(player)
        }
    })
}
