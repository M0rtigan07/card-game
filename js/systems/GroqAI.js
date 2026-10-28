const API_ENDPOINT = "/api/generate-lore";
const REQUEST_TIMEOUT_MS = 10000;

const LORE_FALLBACKS = {
    "Guerrero": "LAS LEYENDAS HABLAN DE TU ESPADA. TRAS AÑOS DE BATALLAS, EL MAZO RECLAMA TU VALOR. DESENFAÑA TU ACERO...",
    "Maga Arcana": "LOS TOMOS PROHIBIDOS SUSURRABAN UN PRESAGIO SOBRE EL MAZO. SIENTE EL PULSO DE LA MAGIA...",
    "Pícaro": "EL MAZO ES LA MAYOR DE LAS FORTUNAS. ESCONDIDO EN LAS SOMBRAS, PREPÁRATE PARA EL SAQUEO..."
};

const NPC_FALLBACK_LINE = "Las sombras ocultan la respuesta de tu interlocutor.";
const DEFAULT_ARCHETYPE = "un misterioso habitante de las mazmorras";

export class GroqAI {
    /**
     * Único punto de contacto con el backend (/api/generate-lore).
     * Lanza error si la petición falla o se agota el tiempo.
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
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } finally {
            clearTimeout(timer);
        }
    }

    /** Frase de introducción del héroe. Devuelve siempre un texto. */
    async generateCharacterLore(className) {
        try {
            const data = await this._post({ className });
            if (!data.story) throw new Error("Respuesta sin 'story'");
            return data.story;
        } catch (error) {
            console.warn("[GroqAI] generateCharacterLore:", error.message);
            return LORE_FALLBACKS[className] || LORE_FALLBACKS["Guerrero"];
        }
    }

    /**
     * Reacción de un PNJ a lo que elige el jugador. Devuelve siempre un texto.
     * @param {object} npc        Entrada de NPC_DATABASE (usa id, name y archetype)
     * @param {string} choiceText Texto de la opción elegida
     * @param {string} className  Nombre de la clase del jugador ("Guerrero", ...)
     */
    async generateNpcDialogue(npc, choiceText, className) {
        try {
            const data = await this._post({
                type: "npc_interaction",
                npc: npc.id,
                npcName: npc.name,
                npcArchetype: npc.archetype || DEFAULT_ARCHETYPE,
                className,
                action: choiceText
            });
            if (!data.description) throw new Error("Respuesta sin 'description'");
            return data.description;
        } catch (error) {
            console.warn("[GroqAI] generateNpcDialogue:", error.message);
            return NPC_FALLBACK_LINE;
        }
    }

    /**
     * Encuentro procedural: { npcType, description, choices: [{ text, action }] }.
     * Devuelve null si la respuesta no es válida, para que el juego use su plan B.
     */
    async generateExploration(className, dungeonLevel) {
        try {
            const data = await this._post({ type: "exploration", className, dungeonLevel });

            const valid = typeof data.description === "string"
                && Array.isArray(data.choices)
                && data.choices.length > 0
                && data.choices.every(c => typeof c.text === "string" && typeof c.action === "string");

            if (!valid) throw new Error("Encuentro con formato inválido");
            return data;
        } catch (error) {
            console.warn("[GroqAI] generateExploration:", error.message);
            return null;
        }
    }
}
