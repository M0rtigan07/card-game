import assert from 'node:assert/strict';
import test from 'node:test';
import { createDarkWorldState, DarkWorld } from './DarkWorld.js';

test('the minotaur message starts a parallel battle only from the loaded world frame', () => {
    const originalDocument = globalThis.document;
    const originalWindow = globalThis.window;
    const frame = { contentWindow: {} };
    const startedEncounters = [];
    const shownScreens = [];
    const game = {
        combat: {
            inCombat: false,
            start(enemy) { startedEncounters.push(enemy); }
        },
        ui: { showScreen(screen) { shownScreens.push(screen); } }
    };
    const world = new DarkWorld(game);

    globalThis.document = { getElementById: () => frame };
    globalThis.window = { location: { origin: 'https://game.test' } };

    try {
        world.handleParallelWorldMessage({
            origin: 'https://attacker.test',
            source: frame.contentWindow,
            data: { type: 'dark-world:start-minotaur-combat' }
        });
        world.handleParallelWorldMessage({
            origin: 'https://game.test',
            source: {},
            data: { type: 'dark-world:start-minotaur-combat' }
        });
        assert.equal(startedEncounters.length, 0);

        world.handleParallelWorldMessage({
            origin: 'https://game.test',
            source: frame.contentWindow,
            data: { type: 'dark-world:start-minotaur-combat' }
        });

        assert.deepEqual(shownScreens, ['gameScreen']);
        assert.equal(startedEncounters.length, 1);
        assert.equal(startedEncounters[0].img, 'img/moscuro/minotauro_retrato_combate.png');
        assert.equal(startedEncounters[0].deckId, 'minotauro');
        assert.equal(startedEncounters[0].returnToDarkWorld, true);
    } finally {
        globalThis.document = originalDocument;
        globalThis.window = originalWindow;
    }
});

test('returning from the minotaur battle reopens the world and reports the victory', () => {
    const originalDocument = globalThis.document;
    const originalWindow = globalThis.window;
    const messages = [];
    const frame = {
        contentWindow: {
            postMessage(data, origin) { messages.push({ data, origin }); }
        }
    };
    const shownScreens = [];
    const world = new DarkWorld({ ui: { showScreen(screen) { shownScreens.push(screen); } } });

    globalThis.document = { getElementById: () => frame };
    globalThis.window = { location: { origin: 'https://game.test' } };

    try {
        world.returnFromMinotaurCombat();

        assert.deepEqual(shownScreens, ['darkWorldScreen']);
        assert.deepEqual(messages, [{
            data: { type: 'dark-world:minotaur-defeated' },
            origin: 'https://game.test'
        }]);
    } finally {
        globalThis.document = originalDocument;
        globalThis.window = originalWindow;
    }
});

test('mission progress from the world frame is stored for later dungeon returns', () => {
    const originalDocument = globalThis.document;
    const originalWindow = globalThis.window;
    const frame = { contentWindow: {} };
    const game = {
        player: { storyState: { darkWorld: createDarkWorldState(23) } }
    };
    const world = new DarkWorld(game);

    globalThis.document = { getElementById: () => frame };
    globalThis.window = { location: { origin: 'https://game.test' } };

    try {
        world.handleParallelWorldMessage({
            origin: 'https://game.test',
            source: frame.contentWindow,
            data: {
                type: 'dark-world:mission-progress',
                progress: {
                    portalCrossed: true,
                    royalClueFound: true,
                    guardianPassed: true,
                    guardianDefeated: false,
                    princessTrailFound: false
                }
            }
        });
        assert.deepEqual(game.player.storyState.darkWorld.mission, {
            portalCrossed: true,
            royalClueFound: true,
            guardianPassed: true,
            guardianDefeated: false,
            princessTrailFound: false
        });
    } finally {
        globalThis.document = originalDocument;
        globalThis.window = originalWindow;
    }
});

test('re-entering the dark world resumes its saved mission and route progress', () => {
    const originalDocument = globalThis.document;
    const storyState = {
        darkWorld: {
            active: false,
            entryFloor: 23,
            location: 3,
            steps: 2,
            mission: {
                portalCrossed: true,
                royalClueFound: true,
                guardianPassed: false,
                guardianDefeated: false,
                princessTrailFound: false
            }
        }
    };
    const game = {
        player: { storyState },
        dungeonLevel: 24,
        ui: { setRealmMode() {} },
        loadNextEvent() {}
    };
    const world = new DarkWorld(game);
    globalThis.document = {
        body: { classList: { add() {} } }
    };

    try {
        world.enter();

        assert.equal(storyState.darkWorld.active, true);
        assert.equal(storyState.darkWorld.entryFloor, 24);
        assert.equal(storyState.darkWorld.location, 3);
        assert.equal(storyState.darkWorld.mission.royalClueFound, true);
    } finally {
        globalThis.document = originalDocument;
    }
});
