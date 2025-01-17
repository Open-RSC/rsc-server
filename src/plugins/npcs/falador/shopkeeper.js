const { canIHelpYou } = require('../general-shopkeeper');

const SHOPKEEPER_IDS = new Set([105, 106]);

async function onTalkToNPC(player, npc) {
    if (!SHOPKEEPER_IDS.has(npc.id)) {
        return false;
    }

    return await canIHelpYou(player, npc, 'falador-general');
}

module.exports = { onTalkToNPC };
