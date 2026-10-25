// js/views/ElviraView.js
export class ElviraView {
    constructor(container, gameInstance) {
        this.container = container;
        this.game = gameInstance;
        this.currentScene = {
            title: "Cripta de las Sombras",
            image: "img/dungeon_intro_bg.png",
            text: "Te encuentras ante una arbolada avenida victoriana que conduce a la mansión abandonada...",
            choices: []
        };
    }

    render() {
        this.container.innerHTML = `
            <div class="elvira-viewport">
                <!-- Marco de la Escena Pixel Art -->
                <div class="elvira-scene-frame">
                    <img id="elviraSceneImg" src="${this.currentScene.image}" alt="Escena actual">
                    <div class="elvira-scene-overlay">
                        <span id="elviraSceneTitle">${this.currentScene.title}</span>
                    </div>
                </div>

                <!-- Diálogo y Narrativa de la IA -->
                <div class="elvira-textbox">
                    <p id="elviraText">${this.currentScene.text}</p>
                </div>

                <!-- Opciones / Respuestas del Jugador -->
                <div id="elviraChoices" class="elvira-choices-container"></div>
            </div>
        `;
    }

    updateScene(sceneData) {
        const imgEl = document.getElementById('elviraSceneImg');
        const titleEl = document.getElementById('elviraSceneTitle');
        const textEl = document.getElementById('elviraText');
        const choicesContainer = document.getElementById('elviraChoices');

        if (imgEl && sceneData.image) imgEl.src = sceneData.image;
        if (titleEl && sceneData.title) titleEl.textContent = sceneData.title;
        if (textEl && sceneData.text) textEl.textContent = sceneData.text;

        if (choicesContainer) {
            choicesContainer.innerHTML = '';
            (sceneData.choices || []).forEach(choice => {
                const btn = document.createElement('button');
                btn.className = 'choice-btn';
                btn.textContent = choice.text;
                btn.addEventListener('click', () => choice.callback());
                choicesContainer.appendChild(btn);
            });
        }
    }
}