import assert from 'node:assert/strict';
import test from 'node:test';
import { UIManager } from './UIManager.js';

test('updateStats renders the floor as a Roman numeral and the hero level', () => {
    const elements = {
        sidebarFloorRoman: { textContent: 'I' },
        sidebarHeroLevel: { textContent: '1' },
        inventoryCount: { textContent: '' }
    };
    const previousDocument = globalThis.document;
    globalThis.document = {
        getElementById(id) {
            return elements[id] ?? null;
        }
    };

    const ui = new UIManager();
    ui.renderParty = () => {};
    ui.refreshInventory = () => {};

    try {
        ui.updateStats({ inventory: [], level: 7 }, 14);

        assert.equal(elements.sidebarFloorRoman.textContent, 'XIV');
        assert.equal(elements.sidebarHeroLevel.textContent, '7');

        ui.updateStats({ inventory: [], level: 8 });

        assert.equal(elements.sidebarFloorRoman.textContent, 'XIV');
        assert.equal(elements.sidebarHeroLevel.textContent, '8');
    } finally {
        if (previousDocument === undefined) delete globalThis.document;
        else globalThis.document = previousDocument;
    }
});
