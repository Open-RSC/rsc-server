// https://classic.runescape.wiki/w/Transcript:Bartender#Bartender_(The_Rusty_Anchor)

const {
    shouldHandleBar,
    rustyAnchorBarcrawl
} = require('../../miniquests/barcrawl');

const { bartenderIntro } = require('../../quests/free/goblin-diplomacy');

const BARTENDER_ID = 44;
const BEER_ID = 193;

async function onTalkToNPC(player, npc) {
    if (npc.id !== BARTENDER_ID) {
        return false;
    }

    player.engage(npc);

    const choices = ['Could i buy a beer please?'];

    if (player.questStages.goblinDiplomacy === -1) {
        choices.push('Not very busy in here today is it?');
    } else {
        choices.push('Have you heard any more rumours in here?');
    }

    if (shouldHandleBar('rustyAnchor')) {
        choices.push("I'm doing Alfred Grimhand's barcrawl");
    }

    const choice = await player.ask(choices);

    if (choice === 0) { // buy a beer
        await player.say('Could i buy a beer please?');
        await npc.say('Sure that will be 2 gold coins please');

        if (player.inventory.has(10, 2)) {
            await player.say('Ok here you go thanks');
            player.inventory.remove(10, 2);
            player.inventory.addItem(BEER_ID);
            player.message('you buy a pint of beer');
        } else {
            player.message('You dont have enough coins for the beer');
        }
    // not very busy
    } else if (player.questStages.goblinDiplomacy === -1 && choice === 1) {
        await bartenderIntro(player, npc);
    } else if (choice === 1) { // more rumours
        await player.say('Have you heard any more rumours in here?');
        await npc.say("No it hasn't been very busy lately");
    } else if (choice === 2) {
        await player.say("I'm doing Alfred Grimhand's barcrawl");
        await rustyAnchorBarcrawl(player, npc);
    }

    player.disengage();

    return true;
}

module.exports = { onTalkToNPC };
