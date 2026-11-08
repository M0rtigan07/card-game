// js/stories/StoryResolver.js

export class StoryResolver {

    static applyChoice(player, choice, game = null) {

        console.log(
            "[STORY]",
            choice.text
        );

        // VIDA

        if (choice.hp) {

            player.health = Math.min(
                player.maxHealth,
                player.health + choice.hp
            );

            console.log(
                `[STORY] +${choice.hp} HP`
            );
        }

        // DAÑO

        if (choice.damage) {

            player.health = Math.max(
                1,
                player.health - choice.damage
            );

            console.log(
                `[STORY] -${choice.damage} HP`
            );
        }

        // ORO

        if (choice.gold) {

            player.gold += choice.gold;

            console.log(
                `[STORY] +${choice.gold} oro`
            );
        }

        // RELIQUIAS

        if (choice.relic) {

            player.relics =
                player.relics || [];

            player.relics.push(
                choice.relic
            );

            console.log(
                `[STORY] Reliquia: ${choice.relic}`
            );
        }

        // OBJETOS

        if (choice.item) {

            player.inventory =
                player.inventory || [];

            player.inventory.push(
                choice.item
            );

            console.log(
                `[STORY] Objeto: ${choice.item}`
            );
        }

        // CARTAS

        if (
            choice.cardId &&
            game?.deck
        ) {

            game.deck.addCard(
                choice.cardId
            );

            console.log(
                `[STORY] Carta: ${choice.cardId}`
            );
        }

        // CAPÍTULO

        if (
            choice.storyId &&
            choice.nextChapter !== undefined
        ) {

            player.storyState =
                player.storyState || {};

            player.storyState[
                choice.storyId
            ] = choice.nextChapter;

            console.log(
                `[STORY] ${choice.storyId} -> cap ${choice.nextChapter}`
            );
        }

        return true;
    }
}