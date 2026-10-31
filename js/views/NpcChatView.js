// js/views/NpcChatView.js
export class NpcChatView {
    constructor(container, gameInstance) {
        this.container = container;
        this.game = gameInstance;
    }

    render(npc, initialLine) {
        const roomImg = npc.images?.talk || npc.images?.room || 'img/guerrero.png';

        this.container.innerHTML = `
            <h1 id="dungeonTitle">Conversación</h1>

            <!-- ESCENA / RETRATO DEL PNJ -->
            <div class="elvira-scene-frame" style="height: 320px;">
                <img id="npcChatImage" src="${roomImg}" alt="${npc.name}" style="object-fit: contain;">
                <div class="elvira-scene-badge">INTERACCIÓN CON PNJ</div>
                
                <!-- CAJA DE TEXTO ESTILO AVENTURA GRÁFICA (SOBREPUESTA ABAJO) -->
                <div class="monkey-dialogue-box" style="position: absolute; bottom: 10px; left: 10px; right: 10px;">
                    <b id="npcChatName">${npc.name}</b>
                    <p id="npcChatText">"${initialLine}"</p>
                </div>
            </div>

            <!-- CONTROLES DE CHAT Y DESPEDIDA -->
            <div class="choices-container" style="margin-top: 15px;">
                <div style="display: flex; gap: 10px; width: 100%;">
                    <input type="text" id="playerChatInput" placeholder="Escribe lo que quieres decirle..." class="choice-btn" style="flex: 1; background: #050a07; cursor: text;" />
                    <button id="btnSendChat" class="fantasy-btn">Hablar 💬</button>
                </div>
                <button id="btnLeaveChat" class="choice-btn" style="text-align: center; background: rgba(239, 68, 68, 0.2); border-color: #ef4444; color: #fca5a5;">
                    🚪 Despedirse y marchar
                </button>
            </div>
        `;
    }

    updateLine(speakerName, line) {
        const nameEl = document.getElementById('npcChatName');
        const textEl = document.getElementById('npcChatText');
        if (nameEl) nameEl.textContent = speakerName;
        if (textEl) textEl.textContent = `"${line}"`;
    }
}