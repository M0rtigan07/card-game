// js/views/TcgCombatView.js
export class TcgCombatView {
    constructor(container, gameInstance) {
        this.container = container;
        this.game = gameInstance;
    }

    render(enemyData, player) {
        this.container.innerHTML = `
            <h1 id="dungeonTitle">Combate TCG</h1>

            <!-- VISOR DE COMBATE (HÉROE VS ENEMIGO) - TAMAÑO AMPLIADO -->
            <div class="elvira-scene-frame" style="height: 220px;">
                <div class="vs-container" style="gap: 30px;">
                    <!-- Retrato del Héroe (Más grande) -->
                    <div class="character-portrait" id="heroPortraitContainer">
                        <img id="sceneImage" src="${player.img || 'img/guerrero.png'}" alt="Héroe" style="max-height: 160px;">
                        <span class="character-tag" id="heroPortraitName">${this.game.playerName || 'HÉROE'}</span>
                    </div>

                    <!-- Indicador VS -->
                    <span class="vs-badge" style="font-size: 1.8em;">VS</span>

                    <!-- Retrato del Enemigo (Más grande) -->
                    <div class="character-portrait" id="enemyPortraitContainer">
                        <img id="enemySceneImage" src="${enemyData.img}" alt="Enemigo" style="max-height: 160px;">
                        <span class="character-tag enemy-tag" id="enemyPortraitName">${enemyData.name}</span>
                    </div>
                </div>
                <div class="elvira-scene-badge">ZONA DE DUELO</div>
            </div>

            <!-- ESTADÍSTICAS DEL ENEMIGO Y CARTA ACTIVA DE LA IA -->
            <div id="enemyStatus" class="enemy-card-status">
                <h3 id="enemyName">${enemyData.name}</h3>
                <div class="enemy-stats-row">
                    <span id="enemyHp">❤️ HP: ${enemyData.hp}/${enemyData.maxHp}</span>
                    <span id="enemyAtk">⚔️ ATK: ${enemyData.atk}</span>
                    <span id="enemyShield">🛡️ DEF: ${enemyData.shield}</span>
                </div>
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
    }
}