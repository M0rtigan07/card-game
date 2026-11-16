import { createAllyStatus } from '../ui/AllyStatus.js';

// js/views/TcgCombatView.js
export class TcgCombatView {
    constructor(container, gameInstance) {
        this.container = container;
        this.game = gameInstance;
    }

    render(enemyData, player) {
        const activeAllies = this.game.party.active;

        this.container.innerHTML = `
            <h1 id="dungeonTitle">Combate TCG</h1>

            <section class="combat-allies" aria-label="Aliados en combate">
                <h2>⚔️ Aliados en combate</h2>
                <div class="combat-allies-list"></div>
                <div id="allySpeech" class="ally-speech" aria-live="polite" aria-atomic="true"></div>
            </section>

            <div class="elvira-scene-frame combat-arena">
                <div class="vs-container">
                    <div class="character-portrait" id="heroPortraitContainer">
                        <img id="sceneImage" src="${player.img || 'img/guerrero.png'}" alt="Héroe">
                        <span class="character-tag" id="heroPortraitName">${this.game.playerName || 'HÉROE'}</span>
                    </div>

                    <span class="vs-badge">VS</span>

                    <div class="character-portrait" id="enemyPortraitContainer">
                        <img id="enemySceneImage" src="${enemyData.img}" alt="Enemigo" onerror="this.onerror=null;this.src='img/guerreroCorrupto.png'">
                        <span class="character-tag enemy-tag" id="enemyPortraitName">${enemyData.name}</span>
                    </div>
                </div>
                <div class="elvira-scene-badge">ZONA DE DUELO</div>
            </div>

            <section class="combat-vitals-row" aria-label="Estado de los combatientes">
                <div class="combat-vitals hero-combat-vitals">
                    <div class="combat-vitals-line">
                        <strong>${this.game.playerName || 'HÉROE'}</strong>
                        <b id="heroCombatHp">${player.health}/${player.maxHealth}</b>
                    </div>
                    <div
                        id="heroCombatHealthMeter"
                        class="combat-health-meter"
                        role="progressbar"
                        aria-label="Vida del héroe"
                        aria-valuemin="0"
                        aria-valuemax="${player.maxHealth}"
                        aria-valuenow="${player.health}"
                    >
                        <span id="heroCombatHealthFill" class="combat-health-fill hero-health-fill"></span>
                    </div>
                    <small id="heroCombatShield" class="combat-shield">🛡️ Guardia: 0</small>
                </div>

                <div class="combat-vitals enemy-combat-vitals">
                    <div class="combat-vitals-line">
                        <strong id="enemyName">${enemyData.name}</strong>
                        <b id="enemyHp">${enemyData.hp}/${enemyData.maxHp}</b>
                    </div>
                    <div
                        id="enemyCombatHealthMeter"
                        class="combat-health-meter"
                        role="progressbar"
                        aria-label="Vida del enemigo"
                        aria-valuemin="0"
                        aria-valuemax="${enemyData.maxHp}"
                        aria-valuenow="${enemyData.hp}"
                    >
                        <span id="enemyCombatHealthFill" class="combat-health-fill enemy-health-fill"></span>
                    </div>
                    <div class="enemy-stats-row">
                        <span id="enemyAtk">⚔️ ATK: ${enemyData.atk}</span>
                        <span id="enemyShield">🛡️ DEF: ${enemyData.shield}</span>
                    </div>
                </div>
            </section>

            <!-- ESTADÍSTICAS DEL ENEMIGO Y CARTA ACTIVA DE LA IA -->
            <div id="enemyStatus" class="enemy-card-status">
                <div id="enemySpeech" class="enemy-speech"></div>
                <div id="enemyIntent" class="enemy-intent"></div>
                <div id="combatStatusLine" class="combat-status-line"></div>
            </div>

            <!-- TABLERO DE CARTAS TCG (BAJADO Y ESPACIADO) -->
            <div id="tcgCombatView" style="display:flex; width:100%; flex-direction:column; align-items:center; gap:12px; margin-top: 10px;">
                <div id="energyBar" class="energy-bar"></div>
                <div id="playerHand" class="tcg-hand" style="min-height: 180px; padding: 15px;">
                    <!-- Las cartas se inyectarán aquí -->
                </div>
                <button id="endTurnTcgBtn" class="fantasy-btn" style="background:#ef4444; color:white; padding: 10px 24px;">Finalizar Turno ⏳</button>
            </div>
        `;

        const alliesList = this.container.querySelector('.combat-allies-list');
        if (activeAllies.length === 0) {
            const empty = document.createElement('span');
            empty.className = 'combat-party-empty';
            empty.textContent = 'Sin compañeros activos: combates en solitario.';
            alliesList.appendChild(empty);
            return;
        }

        activeAllies.forEach(ally => {
            const card = document.createElement('div');
            card.id = `combat-ally-${ally.id}`;
            card.className = `combat-ally${ally.health <= 0 ? ' knocked-out' : ''}`;

            const image = document.createElement('img');
            image.src = ally.card;
            image.alt = '';

            const info = document.createElement('div');
            info.className = 'combat-ally-info';
            const name = document.createElement('span');
            name.className = 'combat-ally-name';
            name.textContent = ally.name;
            info.append(name, createAllyStatus(ally, 'combat'));
            card.append(image, info);
            alliesList.appendChild(card);
        });
    }
}