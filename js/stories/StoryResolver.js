// js/stories/StoryResolver.js

export class StoryResolver {

    static applyChoice(player, choice, game) {

        if (!player.storyState) {
            player.storyState = {};
        }

        if (choice.hp) {
            player.health = Math.min(
                player.maxHealth,
                player.health + choice.hp
            );
        }

        if (choice.damage) {
            player.health -= choice.damage;
        }

        if (choice.gold) {
            player.gold += choice.gold;
        }

        if (choice.cardId && game.deck) {
            game.deck.addCard(choice.cardId);
        }

        if (choice.relic) {

            if (!player.relics) {
                player.relics = [];
            }

            player.relics.push(choice.relic);
        }

        if (
            choice.storyId &&
            choice.nextChapter !== undefined
        ) {
            player.storyState[
                choice.storyId
            ] = choice.nextChapter;
        }

        return true;
    }
}