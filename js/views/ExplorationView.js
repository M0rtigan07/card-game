// js/views/ExplorationView.js
export class ExplorationView {
    constructor(container, gameInstance) {
        this.container = container;
        this.game = gameInstance;
    }

    render() {
        this.container.innerHTML = `
          <h1 id="dungeonTitle">Cámara de la Mazmorra</h1>

            <!-- 1. CUADRO DE TEXTO DEL MASTER (ARRIBA) -->
            <div id="explorationBox" class="exploration-panel">
                <p id="explorationText">El Dungeon Master está tejiendo tu misión...</p>
            </div>

            <!-- 2. VISOR DE ESCENA ANCHO (ESTILO ELVIRA) -->
            <div id="rpgSceneView" class="elvira-scene-frame">
                <img id="centralSceneImage" src="${this.game.player?.img || 'img/guerrero.png'}" alt="Escena de la Mazmorra">
                <div class="elvira-scene-badge" id="sceneBadgeOverlay">SALA DE EXPLORACIÓN</div>
            </div>

            <!-- 3. OPCIONES DE EXPLORACIÓN / ACCIONES DEL JUGADOR -->
            <div id="actionChoices" class="choices-container"></div>
        `;
    }

    setNarrative(text, choices) {
        const textEl = document.getElementById('explorationText');
        if (textEl) textEl.textContent = text;

        const choicesContainer = document.getElementById('actionChoices');
        if (choicesContainer) {
            choicesContainer.innerHTML = '';
            choices.forEach(choice => {
                const btn = document.createElement('button');
                btn.className = 'choice-btn';
                btn.textContent = choice.text;
                btn.addEventListener('click', choice.callback);
                choicesContainer.appendChild(btn);
            });
        }
    }
}