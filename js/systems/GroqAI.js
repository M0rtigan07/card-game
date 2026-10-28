const API_ENDPOINT = "/api/generate-lore";
const REQUEST_TIMEOUT_MS = 10000;

const LORE_FALLBACKS = {
    "Guerrero": "LAS LEYENDAS HABLAN DE TU ESPADA. TRAS AÑOS DE BATALLAS, EL MAZO RECLAMA TU VALOR. DESENFAÑA TU ACERO...",
    "Maga Arcana": "LOS TOMOS PROHIBIDOS SUSURRABAN UN PRESAGIO SOBRE EL MAZO. SIENTE EL PULSO DE LA MAGIA...",
    "Pícaro": "EL MAZO ES LA MAYOR DE LAS FORTUNAS. ESCONDIDO EN LAS SOMBRAS, PREPÁRATE PARA EL SAQUEO..."
};

export class GroqAI {
    /**
     * Único punto de contacto con el backend.
     * Lanza un error si la petición falla, se agota el tiempo o la respuesta no es válida.
     */
    async _post(payload) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        try {
            const response = await fetch(API_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } finally {
            clearTimeout(timer);
        }
    }

    async generateCharacterLore(className) {
        try {
            const data = await this._post({ className });
            if (!data.story) throw new Error("Respuesta sin 'story'");
            return data.story;
        } catch (error) {
            // En local sin Vercel dev (o si la API falla) se usa el relato de contingencia
            console.warn("[GroqAI] generateCharacterLore:", error.message);
            return LORE_FALLBACKS[className] || LORE_FALLBACKS["Guerrero"];
        }
    }

    async generateNpcDialogue(npcKey, playerChoice, playerClass = null) {
        try {
            const data = await this._post({
                type: "npc_interaction",
                npc: npcKey,
                action: playerChoice,
                playerClass
            });
            if (!data.description) throw new Error("Respuesta sin 'description'");
            return data.description;
        } catch (error) {
            console.warn("[GroqAI] generateNpcDialogue:", error.message);
            return "Las sombras ocultan la respuesta de tu interlocutor.";
        }
    }

    /**
     * Antes llamaba a this.queryGroq(), que no existe.
     * Ahora reutiliza el mismo endpoint que el resto de NPCs.
     */
    async generateVampireDialogue(playerClass, actionChosen) {
        try {
            const data = await this._post({
                type: "npc_interaction",
                npc: "valerius",
                action: actionChosen,
                playerClass
            });
            if (!data.description) throw new Error("Respuesta sin 'description'");
            return data.description;
        } catch (error) {
            console.warn("[GroqAI] generateVampireDialogue:", error.message);
            return "Tu presencia aquí es un insulto a la eternidad.";
        }
    }
}