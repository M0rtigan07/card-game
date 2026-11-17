import assert from 'node:assert/strict';
import test from 'node:test';
import { BUSGOSU_PORTAL } from './common/busgosuPortal.js';
import { StoryManager } from './StoryManager.js';
import { StoryResolver } from './StoryResolver.js';

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
    const player = { storyState: { busgosu: 4 } };
    const beginSearch = BUSGOSU_PORTAL.chapters[3].choices[0];

    StoryResolver.applyChoice(player, beginSearch);

    assert.equal(player.storyState.busgosu, -1);
    assert.deepEqual(player.storyState.quests['hija-del-rey'], {
        ...beginSearch.quest,
        status: 'active'
    });
});
