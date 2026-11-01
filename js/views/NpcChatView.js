// js/views/NpcChatView.js
// Vista de conversación estilo aventura gráfica: retrato del personaje, caja de diálogo con texto que se
// escribe letra a letra, menú de temas numerado y entrada libre. Solo dibuja: la lógica está en systems/NpcChat.js.
//
// Los textos que vienen de datos o de la IA se ponen SIEMPRE con textContent (nunca dentro de innerHTML).

import { FALLBACK_IMG } from '../data/gameConfig.js';
import { wait } from '../ui/helpers.js';

export class NpcChatView {
    constructor(container, gameInstance) {
        this.container = container;
        this.game = gameInstance;
        this.alive = false;                        // false al cerrar: corta cualquier texto que se estuviera escribiendo
        this.skip = false;                         // un clic en la caja completa la frase de golpe
        this.images = { idle: FALLBACK_IMG, talking: FALLBACK_IMG };
    }

    el(id) {
        return document.getElementById(id);
    }

    /** Dibuja la escena. `npc` aporta nombre e imágenes; el héroe, su nombre y su retrato. */
    render({ npc, heroName, heroImg }) {
        this.alive = true;

        const idle = npc.images?.room || npc.img || FALLBACK_IMG;
        this.images = { idle, talking: npc.images?.talk || idle };

        this.container.innerHTML = `
            <h1 id="dungeonTitle">Conversación</h1>

            <!-- ESCENA: RETRATO DEL PNJ, RETRATO DEL HÉROE Y CAJA DE TEXTO SOBREPUESTA -->
            <div class="elvira-scene-frame chat-scene">
                <img id="npcChatImage" class="chat-portrait" alt="">
                <img id="chatHeroImage" class="chat-hero-portrait" alt="">
                <div class="elvira-scene-badge">CONVERSACIÓN</div>

                <div id="chatDialogueBox" class="monkey-dialogue-box chat-dialogue-box" title="Clic para completar la frase">
                    <b id="npcChatName"></b>
                    <p id="npcChatText"></p>
                    <span id="chatContinue" class="chat-continue">▼</span>
                </div>
            </div>

            <!-- MENÚ DE TEMAS, ENTRADA LIBRE Y DESPEDIDA -->
            <div class="chat-controls">
                <ul id="chatOptions" class="chat-options"></ul>
                <div class="chat-free-row">
                    <input type="text" id="playerChatInput" class="choice-btn chat-input" autocomplete="off" />
                    <button id="btnSendChat" class="fantasy-btn">Hablar 💬</button>
                </div>
               
                <button id="btnLeaveChat" class="choice-btn chat-leave">🚪 Despedirse y marchar</button>
            </div>
        `;

        this.setImage('npcChatImage', idle);
        this.setImage('chatHeroImage', heroImg || FALLBACK_IMG);
        this.el('npcChatName').textContent = npc.name;
        this.el('chatDialogueBox').addEventListener('click', () => { this.skip = true; });
    }

    /** Cierra la vista: cualquier frase que se estuviera escribiendo se detiene. */
    destroy() {
        this.alive = false;
    }

    setImage(id, src) {
        const img = /** @type {HTMLImageElement | null} */ (this.el(id));
        if (!img) return;
        img.onerror = () => { img.onerror = null; img.src = FALLBACK_IMG; };
        img.src = src;
    }

    // El retrato "mueve la boca": cambia a su imagen de hablar (si la tiene) y se balancea mientras escribe
    setTalking(on) {
        this.setImage('npcChatImage', on ? this.images.talking : this.images.idle);
        this.el('npcChatImage')?.classList.toggle('talking', on);
    }

    /**
     * Dice una frase en la caja de diálogo, escrita letra a letra (speedMs = 0: de golpe).
     * Se resuelve cuando termina o cuando el jugador hace clic para completarla.
     */
    async say(speakerName, text, { hero = false, speedMs = 0, onTick = null, blipEvery = 2 } = {}) {
        const box = this.el('chatDialogueBox');
        const nameEl = this.el('npcChatName');
        const textEl = this.el('npcChatText');
        if (!this.alive || !box || !nameEl || !textEl) return;

        nameEl.textContent = speakerName;
        box.classList.toggle('hero-speaking', hero);
        this.el('chatHeroImage')?.classList.toggle('speaking', hero);
        this.setTalking(!hero);
        this.el('chatContinue')?.classList.remove('visible');

        const full = `“${text}”`;
        this.skip = false;

        if (speedMs > 0) {
            for (let i = 1; i <= full.length && this.alive && !this.skip; i++) {
                textEl.textContent = full.slice(0, i);
                if (onTick && i % blipEvery === 0) onTick();
                await wait(speedMs);
            }
        }
        if (!this.alive) return;

        textEl.textContent = full;
        this.setTalking(false);
        this.el('chatContinue')?.classList.add('visible');
    }

    /** Mientras la IA piensa la respuesta. */
    showThinking(speakerName) {
        if (!this.alive) return;
        this.el('npcChatName').textContent = speakerName;
        this.el('chatDialogueBox')?.classList.remove('hero-speaking');
        this.el('chatHeroImage')?.classList.remove('speaking');
        this.el('npcChatText').textContent = '...';
        this.el('chatContinue')?.classList.remove('visible');
    }

    /** Compatibilidad con la versión anterior: cambia la frase de golpe, sin efecto de escritura. */
    updateLine(speakerName, line) {
        const nameEl = this.el('npcChatName');
        const textEl = this.el('npcChatText');
        if (nameEl) nameEl.textContent = speakerName;
        if (textEl) textEl.textContent = `“${line}”`;
    }

    // ───────────── Menú de temas y entrada libre ─────────────

    /**
     * Menú numerado estilo Monkey Island. `topics` = [{ id, label, asked }]; los ya preguntados salen apagados con ✓.
     * Con `disabled` (mientras habla alguien) no se puede elegir ninguno.
     */
    renderOptions(topics, onPick, { disabled = false } = {}) {
        const list = this.el('chatOptions');
        if (!list) return;
        list.replaceChildren();

        topics.forEach((topic, index) => {
            const item = document.createElement('li');
            const button = document.createElement('button');
            button.className = `choice-btn chat-option${topic.asked ? ' asked' : ''}`;
            button.textContent = `${index + 1}. ${topic.label}${topic.asked ? ' ✓' : ''}`;
            button.disabled = topic.asked || disabled;
            button.addEventListener('click', () => onPick(topic.id));

            item.appendChild(button);
            list.appendChild(item);
        });
    }

    /** Estado de la entrada libre: cuántos mensajes quedan y si se puede escribir. */
    setFreeInput({ left, max, maxLength, disabled = false }) {
        const input = /** @type {HTMLInputElement | null} */ (this.el('playerChatInput'));
        const send = /** @type {HTMLButtonElement | null} */ (this.el('btnSendChat'));
        const blocked = disabled || left <= 0;

        if (input) {
            input.disabled = blocked;
            input.maxLength = maxLength;
            input.placeholder = left > 0 ? 'Escribe lo que quieres decirle...' : 'Ya no tiene más que decirte por ahora';
        }
        if (send) send.disabled = blocked;
        const counter = this.el('chatFreeCounter');
        if (counter) counter.textContent = `💬 Preguntas libres: ${left}/${max}`;
    }

    bind({ onSend, onLeave }) {
        this.el('btnSendChat')?.addEventListener('click', () => onSend());
        this.el('playerChatInput')?.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                onSend();
            }
        });
        this.el('btnLeaveChat')?.addEventListener('click', () => onLeave());
    }

    readInput() {
        return /** @type {HTMLInputElement | null} */ (this.el('playerChatInput'))?.value ?? '';
    }

    clearInput() {
        const input = /** @type {HTMLInputElement | null} */ (this.el('playerChatInput'));
        if (input) input.value = '';
    }
}
