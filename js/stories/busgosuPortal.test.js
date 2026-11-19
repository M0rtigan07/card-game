import assert from 'node:assert/strict';
import test from 'node:test';
import {
    BUSGOSU_PORTAL,
    BUSGOSU_RIDDLES,
    createBusgosuRiddleEncounter
} from './common/busgosuPortal.js';
import { StoryManager } from './StoryManager.js';
import { StoryResolver } from './StoryResolver.js';
import { advanceDarkWorldState, createDarkWorldState, DarkWorld } from '../systems/DarkWorld.js';
import { NPC_DATABASE } from '../data/npcs.js';
import { Exploration } from '../systems/Exploration.js';

test('Busgosu is the first global story at floor 21', () => {
    const player = { className: 'Guerrero' };
    const encounter = new StoryManager(player).getStoryEncounter(21);

    assert.equal(encounter.storyId, 'busgosu');
    assert.equal(encounter.chapterId, 1);
});

test('a wrong riddle answer ends Busgosu’s story while the correct answer opens the portal chapter', () => {
    const player = { storyState: { busgosu: 2 } };
    const riddle = new StoryManager(player).getStoryEncounter(21);
    const wrongAnswer = riddle.choices.find(choice => choice.action === 'fail_busgosu_riddle');

    StoryResolver.applyChoice(player, wrongAnswer);
    assert.equal(player.storyState.busgosu, -1);

    const correctPlayer = { storyState: { busgosu: 2 } };
    const correctEncounter = new StoryManager(correctPlayer).getStoryEncounter(21);
    const correctAnswer = correctEncounter.choices.find(choice => choice.nextChapter === 3);
    StoryResolver.applyChoice(correctPlayer, correctAnswer);
    assert.equal(correctPlayer.storyState.busgosu, 3);
    const portalEncounter = new StoryManager(correctPlayer).getStoryEncounter(23);
    assert.equal(portalEncounter.chapterId, 3);
    assert.equal(portalEncounter.img, 'img/busgosu_portalon.jpg');
    assert.match(portalEncounter.description, /fía del rei perdióse nel Mundu Escuru/i);
    assert.match(portalEncounter.description, /portalón de piedra cubierto de símbolos/i);
});

test('Busgosu randomly selects every riddle and marks only its answer as correct', () => {
    const selectedQuestions = new Set();

    BUSGOSU_RIDDLES.forEach((riddle, index) => {
        const encounter = createBusgosuRiddleEncounter({}, () => index / BUSGOSU_RIDDLES.length);
        const correct = encounter.choices.find(choice => choice.nextChapter === 3);
        const wrong = encounter.choices.filter(choice => choice.action === 'fail_busgosu_riddle');

        assert.ok(encounter.description.includes(riddle.question));
        assert.equal(correct.text, riddle.answer);
        assert.equal(wrong.length, 2);
        assert.ok(wrong.every(choice => choice.nextChapter === -1));
        selectedQuestions.add(riddle.question);
    });

    assert.equal(selectedQuestions.size, BUSGOSU_RIDDLES.length);
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

test('rejecting Busgosu’s cider shows his angry image, skips his story, and advances the floor', async () => {
    const originalDocument = globalThis.document;
    const badge = { textContent: '' };
    const player = { storyState: { busgosu: 1 } };
    const rendered = [];
    const sceneImages = [];
    const finishedEncounters = [];
    const logs = [];
    const game = {
        player,
        ui: { logEvent(message) { logs.push(message); } },
        finishEncounter(delay) { finishedEncounters.push(delay); }
    };
    const exploration = Object.create(Exploration.prototype);
    exploration.game = game;
    exploration.lockChoices = () => {};
    exploration.render = () => ({
        setNarrative(description, choices) {
            rendered.push({ description, choices });
        }
    });
    exploration.setSceneImage = (image) => sceneImages.push(image);
    globalThis.document = {
        getElementById(id) { return id === 'sceneBadgeOverlay' ? badge : null; }
    };

    try {
        await exploration.onStoryChoice(BUSGOSU_PORTAL.chapters[0].choices[1], 'busgosu');

        assert.equal(player.storyState.busgosu, -1);
        assert.equal(NPC_DATABASE.busgosu.images.enraged, 'img/busgosu_enfado.jpg');
        assert.deepEqual(sceneImages, ['img/busgosu_enfado.jpg']);
        assert.match(rendered[0].description, /Nun te daré sidra/i);
        assert.deepEqual(rendered[0].choices, []);
        assert.equal(badge.textContent, 'EL BUSGOSU SE ENFADA');
        assert.deepEqual(finishedEncounters, [0]);
        assert.ok(logs.some(message => message.includes('no comparte su historia')));
    } finally {
        globalThis.document = originalDocument;
    }
});

test('a wrong riddle answer makes Busgosu say goodbye without revealing the answer', async () => {
    const originalDocument = globalThis.document;
    const badge = { textContent: '' };
    const player = { storyState: { busgosu: 2 } };
    const rendered = [];
    const sceneImages = [];
    const finishedEncounters = [];
    const logs = [];
    const riddle = createBusgosuRiddleEncounter(player, () => 0);
    const wrongAnswer = riddle.choices.find(choice => choice.action === 'fail_busgosu_riddle');
    const correctAnswer = riddle.choices.find(choice => choice.nextChapter === 3);
    const game = {
        player,
        ui: { logEvent(message) { logs.push(message); } },
        finishEncounter(delay) { finishedEncounters.push(delay); }
    };
    const exploration = Object.create(Exploration.prototype);
    exploration.game = game;
    exploration.lockChoices = () => {};
    exploration.render = () => ({
        setNarrative(description, choices) {
            rendered.push({ description, choices });
        }
    });
    exploration.setSceneImage = (image) => sceneImages.push(image);
    globalThis.document = {
        getElementById(id) { return id === 'sceneBadgeOverlay' ? badge : null; }
    };

    try {
        await exploration.onStoryChoice(wrongAnswer, 'busgosu');

        assert.equal(player.storyState.busgosu, -1);
        assert.deepEqual(sceneImages, ['img/busgosu_habla.jpg']);
        assert.match(rendered[0].description, /Fallasti.*Nun hai más intentos/i);
        assert.ok(!rendered[0].description.includes(correctAnswer.text));
        assert.deepEqual(rendered[0].choices, []);
        assert.equal(badge.textContent, 'EL BUSGOSU SE DESPIDE');
        assert.deepEqual(finishedEncounters, [0]);
        assert.ok(logs.some(message => message.includes('se despide')));
    } finally {
        globalThis.document = originalDocument;
    }
});

test('dark-world travel advances its own route without changing the saved dungeon floor', () => {
    const world = createDarkWorldState(23);
    const nextLocation = advanceDarkWorldState(world);

    assert.equal(world.entryFloor, 23);
    assert.equal(nextLocation.entryFloor, 23);
    assert.equal(nextLocation.location, 1);
    assert.equal(nextLocation.steps, 1);
});

test('following footprints from the forest opens the separate adventure without changing dungeon floors', async () => {
    const originalDocument = globalThis.document;
    const originalWindow = globalThis.window;
    const bodyClasses = new Set();
    const parallelWorldClasses = new Set();
    const elements = {
        dungeonTitle: { textContent: '' },
        sceneBadgeOverlay: { textContent: '' },
        darkWorldFrame: {
            dataset: {},
            addEventListener(_event, listener) {
                this.loadListener = listener;
            }
        },
        darkWorldScreen: {
            classList: {
                add(value) { parallelWorldClasses.add(value); }
            }
        },
        darkWorldLoading: { hidden: false }
    };
    const renderedChoices = [];
    const audioEvents = [];
    const shownScreens = [];
    const game = {
        dungeonLevel: 23,
        playerName: 'Manuel',
        player: { gold: 50, storyState: {} },
        party: {
            active: [
                { name: 'Fuera de combate', card: 'img/npcs/cartaArquero.png', health: 0 },
                { name: 'Astrid', card: 'img/npcs/cartaVikinga.png', health: 32 }
            ]
        },
        ui: {
            setRealmMode() {},
            setMerchantGold() {},
            showScreen(id) { shownScreens.push(id); }
        },
        audio: { play(type) { audioEvents.push(type); } },
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
    game.loadNextEvent = () => darkWorld.loadNext();
    globalThis.document = {
        body: {
            classList: {
                add(value) { bodyClasses.add(value); },
                remove(value) { bodyClasses.delete(value); }
            }
        },
        getElementById(id) { return elements[id]; }
    };
    globalThis.window = {
        matchMedia() { return { matches: true }; }
    };

    try {
        darkWorld.enter();
        assert.ok(bodyClasses.has('dark-world'));
        assert.ok(!bodyClasses.has('trail-transition'));
        assert.equal(elements.dungeonTitle.textContent, 'Mundo Oscuro · El umbral sin estrellas');

        await renderedChoices[0].callback();
        assert.equal(game.player.storyState.darkWorld.location, 1);
        assert.deepEqual(audioEvents, ['portal']);
        assert.equal(game.dungeonLevel, 23);
        assert.ok(bodyClasses.has('dark-world'));
        assert.ok(!bodyClasses.has('trail-transition'));
        assert.equal(elements.dungeonTitle.textContent, 'Mundo Oscuro · El bosque petrificado');
        assert.equal(elements.darkWorldFrame.src, undefined);

        await renderedChoices[0].callback();
        assert.equal(game.player.storyState.darkWorld.location, 2);
        assert.deepEqual(audioEvents, ['portal', 'portal']);
        assert.equal(game.dungeonLevel, 23);
        assert.ok(bodyClasses.has('dark-world'));
        const worldUrl = new URL('../../mundo-oscuro.html', import.meta.url);
        worldUrl.searchParams.set('companionName', 'Astrid');
        worldUrl.searchParams.set('companionImage', 'img/npcs/cartaVikinga.png');
        assert.equal(elements.darkWorldFrame.src, worldUrl.href);
        assert.deepEqual(shownScreens, ['darkWorldScreen']);

        elements.darkWorldFrame.loadListener();
        assert.ok(parallelWorldClasses.has('parallel-world-ready'));
        assert.equal(elements.darkWorldLoading.hidden, true);
    } finally {
        globalThis.document = originalDocument;
        globalThis.window = originalWindow;
    }
});
