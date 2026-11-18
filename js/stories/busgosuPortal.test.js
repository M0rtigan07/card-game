import assert from 'node:assert/strict';
import test from 'node:test';
import { BUSGOSU_PORTAL } from './common/busgosuPortal.js';
import { StoryManager } from './StoryManager.js';
import { StoryResolver } from './StoryResolver.js';
import { advanceDarkWorldState, createDarkWorldState, DarkWorld } from '../systems/DarkWorld.js';

test('Busgosu is the first global story at floor 21', () => {
    const player = { className: 'Guerrero' };
    const encounter = new StoryManager(player).getStoryEncounter(21);

    assert.equal(encounter.storyId, 'busgosu');
    assert.equal(encounter.chapterId, 1);
});

test('wrong riddle answers allow another attempt and the correct answer opens the portal chapter', () => {
    const player = { storyState: { busgosu: 2 } };
    const [correctAnswer, wrongAnswer] = BUSGOSU_PORTAL.chapters[1].choices;

    StoryResolver.applyChoice(player, wrongAnswer);
    assert.equal(player.storyState.busgosu, 2);

    StoryResolver.applyChoice(player, correctAnswer);
    assert.equal(player.storyState.busgosu, 3);
    assert.equal(new StoryManager(player).getStoryEncounter(23).chapterId, 3);
});

test('entering the dark world records the active search for the king’s daughter', () => {
    const player = { storyState: { busgosu: 3 } };
    const beginSearch = BUSGOSU_PORTAL.chapters[2].choices[0];

    StoryResolver.applyChoice(player, beginSearch);

    assert.equal(player.storyState.busgosu, -1);
    assert.deepEqual(player.storyState.quests['hija-del-rey'], {
        ...beginSearch.quest,
        status: 'active'
    });
});

test('declining the portal completes the encounter without entering the parallel world', () => {
    const player = { storyState: { busgosu: 3 } };
    const decline = BUSGOSU_PORTAL.chapters[2].choices[1];

    StoryResolver.applyChoice(player, decline);

    assert.equal(player.storyState.busgosu, -1);
    assert.equal(player.storyState.darkWorld, undefined);
});

test('dark-world travel advances its own route without changing the saved dungeon floor', () => {
    const world = createDarkWorldState(23);
    const nextLocation = advanceDarkWorldState(world);

    assert.equal(world.entryFloor, 23);
    assert.equal(nextLocation.entryFloor, 23);
    assert.equal(nextLocation.location, 1);
    assert.equal(nextLocation.steps, 1);
});

test('the portal enters the dark-world scene and returns to the same dungeon floor by following footprints', () => {
    const originalDocument = globalThis.document;
    const bodyClasses = new Set();
    const elements = {
        dungeonTitle: { textContent: '' },
        sceneBadgeOverlay: { textContent: '' }
    };
    const renderedChoices = [];
    let returnedToDungeon = false;
    const game = {
        dungeonLevel: 23,
        player: { gold: 50, storyState: {} },
        ui: {
            setRealmMode() {},
            setMerchantGold() {}
        },
        exploration: {
            render() {
                return {
                    setNarrative(_description, choices) {
                        renderedChoices.splice(0, renderedChoices.length, ...choices);
                    }
                };
            },
            setSceneImage() {}
        }
    };
    const darkWorld = new DarkWorld(game);
    game.loadNextEvent = () => {
        if (game.player.storyState.darkWorld?.active) darkWorld.loadNext();
        else returnedToDungeon = true;
    };
    globalThis.document = {
        body: {
            classList: {
                add(value) { bodyClasses.add(value); },
                remove(value) { bodyClasses.delete(value); }
            }
        },
        getElementById(id) { return elements[id]; }
    };

    try {
        darkWorld.enter();
        assert.ok(bodyClasses.has('dark-world'));
        assert.equal(elements.dungeonTitle.textContent, 'Mundo Oscuro · El umbral sin estrellas');

        renderedChoices[0].callback();
        assert.equal(game.player.storyState.darkWorld.location, 1);
        assert.equal(game.dungeonLevel, 23);

        renderedChoices[1].callback();
        assert.equal(game.player.storyState.darkWorld.active, false);
        assert.ok(!bodyClasses.has('dark-world'));
        assert.equal(game.dungeonLevel, 23);
        assert.equal(returnedToDungeon, true);
    } finally {
        globalThis.document = originalDocument;
    }
});
