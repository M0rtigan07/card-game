export class GroqAI {
    async generateCharacterLore(className) {
        try {
            const response = await fetch("/api/generate-lore", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ className })
            });

            if (!response.ok) throw new Error("Fallback local");
            const data = await response.json();
            return data.story;
        } catch (error) {
            // Si estás probando en local sin Vercel dev, usa el relato de contingencia
            const fallbacks = {
                "Guerrero": "LAS LEYENDAS HABLAN DE TU ESPADA. TRAS AÑOS DE BATALLAS, EL MAZO RECLAMA TU VALOR. DESENFAÑA TU ACERO...",
                "Maga Arcana": "LOS TOMOS PROHIBIDOS SUSURRABAN UN PRESAGIO SOBRE EL MAZO. SIENTE EL PULSO DE LA MAGIA...",
                "Pícaro": "EL MAZO ES LA MAYOR DE LAS FORTUNAS. ESCONDIDO EN LAS SOMBRAS, PREPÁRATE PARA EL SAQUEO..."
            };
            return fallbacks[className] || fallbacks["Guerrero"];
        }
    }

    // Añade este método en tu clase GroqAI si no lo tienes:
    async generateNpcDialogue(npcKey, playerChoice) {
        try {
            const response = await fetch("/api/generate-lore", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: 'npc_interaction',
                    npc: npcKey,
                    action: playerChoice
                })
            });
            const data = await response.json();
            return data.description || "El personaje te mira fijamente en la penumbra sin pronunciar palabra...";
        } catch (err) {
            return "Las sombras ocultan la respuesta de tu interlocutor.";
        }
    }

    async generateVampireDialogue(playerClass, actionChosen) {
        try {
            const prompt = `Actúa como el Conde Valerius, un lord vampiro milenario, aristócrata, extremadamente arrogante, cínico y elegante de un juego de rol gótico oscuro. 
        El jugador es un ${playerClass} que ha tomado la siguiente acción o postura: "${actionChosen}".
        Responde brevemente (máximo 2 líneas) con una frase llena de desdén, superioridad y toque gótico, manteniendo su personalidad altiva. Devuélvelo en un tono teatral tipo aventura gráfica clásica.`;

            // Llamada a tu API de Groq configurada
            const response = await this.queryGroq(prompt);
            return response || "¡Insensato! Tu osadía sella tu destino en mis dominios.";
        } catch (err) {
            return "Tu presencia aquí es un insulto a la eternidad.";
        }
    }
}