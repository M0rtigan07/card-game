export class ExplorationView {
    constructor(container, gameManager) {
        this.container = container;
        this.game = gameManager;
    }

    /**
     * Dibuja y configura la vista de exploración narrativa en el panel central.
     */
    render() {
        // Aseguramos la estructura interna del visor central sin tocar el HTML principal
        this.container.innerHTML = `
            <h1 id="dungeonTitle">Cámara de la Mazmorra</h1>

            <!-- VISOR DE ESCENA RPG -->
            <div id="rpgSceneView" class="scene-frame">
                <div class="vs-container">
                    <div class="character-portrait">
                        <img id="sceneImage" src="${this.game.player ? 'img/' + this.game.player.classKey + '.png' : 'img/guerrero.png'}" alt="Héroe">
                        <span class="character-tag">HÉROE</span>
                    </div>

                    <span class="vs-badge" id="vsBadge" style="display:none;">VS</span>

                    <div class="character-portrait" id="enemyPortraitContainer" style="display:none;">
                        <img id="enemySceneImage" src="img/gargola.png" alt="Enemigo">
                        <span class="character-tag enemy-tag" id="enemyPortraitName">ENEMIGO</span>
                    </div>
                </div>

                <div class="d20-overlay" id="d20Overlay" style="display:none;">
                    <span class="d20-label">TIRADA D20</span>
                    <span class="d20-value" id="d20Val">20</span>
                </div>
            </div>

            <!-- ESTATUTO DEL ENEMIGO (OCULTO POR DEFECTO) -->
            <div id="enemyStatus" class="enemy-card-status" style="display:none;">
                <h3 id="enemyName">Enemigo</h3>
                <div class="enemy-stats-row">
                    <span id="enemyHp">❤️ HP: --</span>
                    <span id="enemyAtk">⚔️ ATK: --</span>
                    <span id="enemyShield">🛡️ DEF: --</span>
                </div>
            </div>

            <!-- DIÁLOGO / MISIONES RPG DEL DUNGEON MASTER -->
            <div id="explorationBox" class="exploration-panel">
                <p id="explorationText">El Dungeon Master está observando tus pasos...</p>
            </div>

            <!-- OPCIONES DE ACCIÓN -->
            <div id="actionChoices" class="choices-container"></div>
        `;
    }

    /**
     * Muestra una escena narrativa con texto y botones de acción.
     * @param {string} text Texto narrativo del Dungeon Master
     * @param {Array} choices Lista de opciones [{ text: "...", callback: function }]
     */
    setNarrative(text, choices = []) {
        const textEl = document.getElementById('explorationText');
        const choicesEl = document.getElementById('actionChoices');

        if (textEl) textEl.textContent = text;
        if (!choicesEl) return;

        choicesEl.innerHTML = '';
        choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'fantasy-btn choice-btn';
            btn.textContent = choice.text;
            btn.addEventListener('click', () => choice.callback());
            choicesEl.appendChild(btn);
        });
    }
}