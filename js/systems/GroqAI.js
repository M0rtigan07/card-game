const API_ENDPOINT = "/api/generate-lore";
const REQUEST_TIMEOUT_MS = 10000;

const LORE_FALLBACKS = {
    "Guerrero": "LAS LEYENDAS HABLAN DE TU ESPADA. TRAS AÑOS DE BATALLAS, EL MAZO RECLAMA TU VALOR. DESENFAÑA TU ACERO...",
    "Maga Arcana": "LOS TOMOS PROHIBIDOS SUSURRABAN UN PRESAGIO SOBRE EL MAZO. SIENTE EL PULSO DE LA MAGIA...",
    "Pícaro": "EL MAZO ES LA MAYOR DE LAS FORTUNAS. ESCONDIDO EN LAS SOMBRAS, PREPÁRATE PARA EL SAQUEO..."
};

const DEFAULT_ARCHETYPE = "un misterioso habitante de las mazmorras";

export class GroqAI {
    /**
     * Único punto de contacto con el backend (/api/generate-lore).
     * Lanza error si la petición falla o se agota el tiempo.
     */
    async _post(payload, timeoutMs = REQUEST_TIMEOUT_MS) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

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
     * Frase de un PNJ generada por la IA, con el contexto de la situación.
     * Devuelve null si falla o tarda, para que el juego use una frase de respaldo.
     *
     * @param {object} request
     * @param {'greeting' | 'reaction' | 'outcome'} request.kind  Saludo, réplica a tu elección o comentario de lo ocurrido
     * @param {object} request.npc             Entrada de NPC_DATABASE (id, name, archetype, voice)
     * @param {string} request.className       Clase del jugador ("Guerrero", ...)
     * @param {string} request.heroName        Nombre del héroe
     * @param {number} request.dungeonLevel
     * @param {number} request.heroHpPercent
     * @param {number} request.gold
     * @param {string} [request.action]        (reaction) Lo que ha elegido el jugador
     * @param {string} [request.outcome]       (outcome) Qué acaba de ocurrir
     * @param {string[]} [request.avoid]       Últimas frases del PNJ, que no debe repetir
     * @param {number} [request.timeoutMs]
     */
    async generateNpcLine({ kind, npc, className, heroName, dungeonLevel, heroHpPercent, gold, action, outcome, avoid = [], timeoutMs }) {
        try {
            const data = await this._post({
                // "npc_interaction" es el tipo que ya entendía el backend antiguo: así las réplicas siguen funcionando
                type: kind === 'reaction' ? 'npc_interaction' : 'npc_line',
                kind,
                npc: npc.id,
                npcName: npc.name,
                npcArchetype: npc.archetype || DEFAULT_ARCHETYPE,
                npcVoice: npc.voice || '',
                className,
                heroName,
                dungeonLevel,
                heroHpPercent,
                gold,
                action,
                outcome,
                avoid
            }, timeoutMs);

            const line = typeof data.description === 'string' ? data.description.trim() : '';
            return line || null;
        } catch (error) {
            console.warn("[GroqAI] generateNpcLine:", error.message);
            return null;
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
