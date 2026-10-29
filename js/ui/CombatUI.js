// js/ui/CombatUI.js
// Todo lo que se dibuja durante un combate. No contiene reglas del juego:
// recibe datos ya calculados y los pinta. La lógica vive en systems/TcgCombat.js.

import { TcgCombatView } from '../views/TcgCombatView.js';
import { setText } from './helpers.js';

const RARITY_LABEL = { common: 'COMÚN', uncommon: 'POCO COMÚN', rare: 'RARA' };

export class CombatUI {
    /** Dibuja la pantalla de combate en el panel central. */
    mount(game, enemy, player) {
        const view = new TcgCombatView(document.getElementById('mainContent'), game);
        view.render(enemy, player);
    }

    bindEndTurn(handler) {
        const btn = document.getElementById('endTurnTcgBtn');
        if (btn) btn.onclick = handler;
    }

    /** Bloquea o desbloquea el botón de fin de turno y la mano mientras juega el enemigo. */
    setControls(enabled) {
        const btn = /** @type {HTMLButtonElement | null} */ (document.getElementById('endTurnTcgBtn'));
        if (btn) btn.disabled = !enabled;
        document.getElementById('playerHand')?.classList.toggle('locked', !enabled);
    }

    setVictory(visible) {
        const modal = document.getElementById('victoryAnimationModal');
        if (modal) modal.style.display = visible ? 'flex' : 'none';
    }

    // ───────────── Cartas y mano ─────────────

    buildCard(card) {
        const el = document.createElement('div');
        el.className = `tcg-card rarity-${card.rarity}`;
        el.innerHTML = `
            <div class="cost-gem">${card.cost}</div>
            <img src="${card.img}" alt="${card.name}" class="tcg-card-img" onerror="this.src='img/guerrero.png'">
            <span class="title">${card.name}</span>
            <span class="desc">${card.desc}</span>
        `;
        return el;
    }

    /** Dibuja la mano. Las cartas que no puedes pagar salen atenuadas. */
    renderHand(hand, energy, onPlay) {
        const container = document.getElementById('playerHand');
        if (!container) return;

        container.innerHTML = '';

        hand.forEach((card, index) => {
            const el = this.buildCard(card);
            if (card.cost > energy) el.classList.add('unplayable');

            const rotation = (index - (hand.length - 1) / 2) * 4;
            el.style.transform = `rotate(${rotation}deg)`;

            el.addEventListener('click', () => onPlay(card, index));
            container.appendChild(el);
        });
    }

    // ───────────── Paneles de información ─────────────

    /** Carta que el enemigo jugará (o está jugando). `intent` = { card, description, cardsLeft, playing } o null. */
    renderIntent(intent) {
        const host = document.getElementById('enemyIntent');
        if (!host) return;
        host.replaceChildren();
        if (!intent) return;

        const { card, description, cardsLeft, playing } = intent;

        const box = document.createElement('div');
        box.className = `enemy-intent-card intent-${card.type}${playing ? ' playing' : ''}`;

        const head = document.createElement('div');
        head.className = 'intent-head';
        const label = document.createElement('span');
        label.textContent = playing ? '¡JUEGA!' : 'PRÓXIMA JUGADA';
        const deckLeft = document.createElement('span');
        deckLeft.textContent = `🃏 ${cardsLeft}`;
        head.append(label, deckLeft);

        const name = document.createElement('b');
        name.className = 'intent-name';
        name.textContent = card.name;

        const desc = document.createElement('span');
        desc.className = 'intent-desc';
        desc.textContent = description;

        box.append(head, name, desc);
        host.appendChild(box);
    }

    /** Barra de energía: un rayo por punto, apagado si ya lo has gastado. */
    renderEnergy(energy, max, counts) {
        const host = document.getElementById('energyBar');
        if (!host) return;
        host.replaceChildren();

        const label = document.createElement('span');
        label.className = 'energy-label';
        label.textContent = 'ENERGÍA';
        host.appendChild(label);

        for (let i = 0; i < max; i++) {
            const pip = document.createElement('span');
            pip.className = `energy-pip${i < energy ? ' full' : ''}`;
            pip.textContent = '⚡';
            host.appendChild(pip);
        }

        const info = document.createElement('span');
        info.className = 'energy-deck';
        info.textContent = `🃏 Mazo ${counts.drawPile}  ·  ♻️ Descarte ${counts.discardPile}`;
        host.appendChild(info);
    }

    /** Línea de estados (guardia, venenos). `parts` = lista de textos. */
    renderStatus(parts) {
        setText('combatStatusLine', parts.join('   ·   '));
    }

    /** Vida, ataque y defensa del enemigo. `attack` ya incluye su bonus de furia. */
    renderEnemyStats(enemy, attack) {
        const bonus = enemy.atkBonus ? ` (+${enemy.atkBonus})` : '';
        setText('enemyName', enemy.name);
        setText('enemyHp', `❤️ HP: ${Math.max(0, enemy.hp)}/${enemy.maxHp}`);
        setText('enemyAtk', `⚔️ ATK: ${attack}${bonus}`);
        setText('enemyShield', `🛡️ DEF: ${enemy.shield}`);
    }

    // ───────────── Efectos visuales ─────────────

    /** Número flotante sobre un retrato (-12, +8, 🛡️...). */
    float(containerId, text, kind) {
        const host = document.getElementById(containerId);
        if (!host) return;
        const el = document.createElement('span');
        el.className = `float-text float-${kind}`;
        el.textContent = text;
        host.appendChild(el);
        setTimeout(() => el.remove(), 1100);
    }

    shake(containerId) {
        const host = document.getElementById(containerId);
        if (!host) return;
        host.classList.remove('hit-shake');
        void host.offsetWidth; // reinicia la animación si se repite
        host.classList.add('hit-shake');
        setTimeout(() => host.classList.remove('hit-shake'), 450);
    }

    // ───────────── Recompensa tras el combate ─────────────

    /**
     * Pantalla de elección de carta.
     * @param {Array<object>} cards    Cartas ofrecidas (ya con sus números)
     * @param {number} skipGold        Oro que se ofrece por saltar
     * @param {{ onPick: (card: object) => void, onSkip: () => void }} handlers
     */
    showReward(cards, skipGold, { onPick, onSkip }) {
        const overlay = document.createElement('div');
        overlay.className = 'reward-overlay';

        const title = document.createElement('div');
        title.className = 'reward-title';
        title.textContent = 'ELIGE UNA CARTA PARA TU MAZO';

        const row = document.createElement('div');
        row.className = 'reward-row';

        cards.forEach(card => {
            const el = this.buildCard(card);
            el.classList.add('reward-card');

            const tag = document.createElement('span');
            tag.className = 'rarity-tag';
            tag.textContent = RARITY_LABEL[card.rarity] || '';
            el.appendChild(tag);

            el.addEventListener('click', () => {
                overlay.remove();
                onPick(card);
            }, { once: true });

            row.appendChild(el);
        });

        const skip = document.createElement('button');
        skip.className = 'fantasy-btn reward-skip';
        skip.textContent = `Saltar (+${skipGold} oro)`;
        skip.addEventListener('click', () => {
            overlay.remove();
            onSkip();
        }, { once: true });

        overlay.append(title, row, skip);
        document.body.appendChild(overlay);
    }
}
