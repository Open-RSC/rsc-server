function walk(player, oldPosition, newPosition) {
    const playersInArea = player.instance.getPlayers(player.position,
        player.viewDistance)
    const players = player.players

    // the player has found new players to be added to their unknown list.
    for (const p of playersInArea) {
        if (player !== p && !player.players.knows(p)) {
            player.players.add(p)
            player.playerUpdates.appearance(p)

            p.players.add(player)
            p.playerUpdates.appearance(player)
        }
    }

    // the player has moved far enough away from the known player
    // they are no longer in the view distance. make both players aware
    for (const known of players.known) {
        const distance = newPosition.distance(known.position)

        if (distance > player.viewDistance) {
            players.remove(known)
            known.players.remove(player)
            return
        }
    }
    if (oldPosition) {
        // this triggers an event to all watched players, alerting them
        // of this player's movement
        player.direction = newPosition.direction(oldPosition)
    }
}

module.exports = player => {
    player.on('position', (oldPosition, newPosition) => {
        // if the player moved more than 1 tile away it has to be considered a
        // teleport. the player must be removed from all watched entities, and
        // readded. technically, this IS a teleport as players are not able to
        // move more than 1 tile at a time.
        let dist = 1;

        if (oldPosition) {
            dist = Math.floor(newPosition.distance(oldPosition))
        }

        if (newPosition && dist <= 1) {
            walk(player, oldPosition, newPosition)
        } else {
            player.emit('teleport', newPosition, false)
        }
    })

    // update the player's instance when they move
    player.on('position', () => player.instance.playerMoved(player))

    player.on('position', (oldPosition, newPosition) => {
        const [regionX, regionY] = [
            player.position.x >> 3,
            player.position.y >> 3
        ]

        if (regionX !== player.region.x || regionY !== player.region.y) {
            player.region = { x: regionX, y: regionY }
            player.emit('region', oldPosition, newPosition)
        }
    })
}
