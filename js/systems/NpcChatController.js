// js/systems/NpcChatController.js
import { NpcChatView } from '../views/NpcChatView.js';

export class NpcChatController {
    /** @param {import('../Game.js').Game} game */
    constructor(game) {
        this.game = game;
        this.view = new NpcChatView(document.getElementById('mainContent'), game);
    }

    async startChat(npc) {
        this.game.audio.play('card');
        
        // Obtenemos el saludo inicial del PNJ (usando el sistema de diálogo con Groq o respaldos)
        const greetingLine = await this.game.dialogue.say(npc, 'greeting');
        
        this.view.render(npc, greetingLine);

        // Enlazar eventos de los botones y la caja de texto
        const sendBtn = document.getElementById('btnSendChat');
        const leaveBtn = document.getElementById('btnLeaveChat');
        const input = /** @type {HTMLInputElement} */ (document.getElementById('playerChatInput'));

        const handleSend = async () => {
            const text = input.value.trim();
            if (!text) return;

            input.value = '';
            this.game.audio.play('card');
            this.game.ui.logEvent(`🗣️ Tú dices: "${text}"`);
            
            // Muestra temporalmente lo que dijo el héroe
            this.view.updateLine(this.game.playerName, text);

            // Pedimos la respuesta inteligente a Groq simulando una reacción a la frase del jugador
            const responseLine = await this.game.dialogue.say(npc, 'reaction', { action: text });
            
            this.view.updateLine(npc.name, responseLine);
            this.game.ui.logEvent(`💬 ${npc.name}: "${responseLine}"`);
        };

        sendBtn.onclick = handleSend;
        input.onkeydown = (e) => { if (e.key === 'Enter') handleSend(); };

        // ** OPCIÓN DE DESPEDIDA **
        leaveBtn.onclick = async () => {
            this.game.audio.play('sega');
            const goodbyeLine = await this.game.dialogue.say(npc, 'offended', { 
                detail: 'El héroe se ha despedido amablemente y se marcha de la estancia.' 
            });
            
            this.view.updateLine(npc.name, goodbyeLine);
            this.game.ui.logEvent(`🏃 Te despides de ${npc.name} y continúas tu camino.`);
            
            // Espera un momento para que lea la despedida y avanza a la siguiente planta
            setTimeout(() => {
                this.game.finishEncounter(1500);
            }, 2000);
        };
    }
}