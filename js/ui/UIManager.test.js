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

test('merchant gold badge shows the current balance and can be hidden', () => {
    const elements = {
        merchantGoldBadge: { hidden: true },
        merchantGoldAmount: { textContent: '' }
    };
    const previousDocument = globalThis.document;
    globalThis.document = {
        getElementById(id) {
            return elements[id] ?? null;
        }
    };

    try {
        const ui = new UIManager();
        ui.setMerchantGold(true, 42000);

        assert.equal(elements.merchantGoldBadge.hidden, false);
        assert.equal(elements.merchantGoldAmount.textContent, '42.000');

        ui.updateMerchantGold(1800);
        assert.equal(elements.merchantGoldAmount.textContent, '1800');

        ui.setMerchantGold(false, 1800);
        assert.equal(elements.merchantGoldBadge.hidden, true);
    } finally {
        if (previousDocument === undefined) delete globalThis.document;
        else globalThis.document = previousDocument;
    }
});
