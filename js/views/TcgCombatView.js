// js/views/TcgCombatView.js
export class TcgCombatView {
    constructor(container, gameInstance) {
        this.container = container;
        this.game = gameInstance;
    }

    render(enemyData, player) {
        this.container.innerHTML = `
            <h1 id="dungeonTitle">Combate TCG</h1>

            <!-- VISOR DE COMBATE (HÉROE VS ENEMIGO) -->
            <div class="elvira-scene-frame">
                <div class="vs-container">
                    <!-- Retrato del Héroe -->
                    <div class="character-portrait" id="heroPortraitContainer">
                        <img id="sceneImage" src="${player.img || 'img/guerrero.png'}" alt="Héroe">
                        <span class="character-tag" id="heroPortraitName">${this.game.playerName || 'HÉROE'}</span>
                    </div>

                    <!-- Indicador VS -->
                    <span class="vs-badge">VS</span>

                    <!-- Retrato del Enemigo -->
                    <div class="character-portrait" id="enemyPortraitContainer">
                        <img id="enemySceneImage" src="${enemyData.img}" alt="Enemigo">
                        <span class="character-tag enemy-tag" id="enemyPortraitName">${enemyData.name}</span>
                    </div>
                </div>
                <div class="elvira-scene-badge">ZONA DE DUELO</div>
            </div>

            <!-- ESTADÍSTICAS DEL ENEMIGO -->
            <div id="enemyStatus" class="enemy-card-status">
                <h3 id="enemyName">${enemyData.name}</h3>
                <div class="enemy-stats-row">
                    <span id="enemyHp">❤️ HP: ${enemyData.hp}/${enemyData.maxHp}</span>
                    <span id="enemyAtk">⚔️ ATK: ${enemyData.atk}</span>
                    <span id="enemyShield">🛡️ DEF: ${enemyData.shield}</span>
                </div>
            </div>

            <!-- TABLERO DE CARTAS TCG (MANO DEL JUGADOR) -->
            <div id="tcgCombatView" style="display:flex; width:100%; flex-direction:column; align-items:center; gap:10px;">
                <div id="playerHand" class="tcg-hand">
                    <!-- Las cartas se inyectarán aquí -->
                </div>
                <button id="endTurnTcgBtn" class="fantasy-btn" style="background:#ef4444; color:white;">Finalizar Turno ⏳</button>
            </div>
        `;
    }
}