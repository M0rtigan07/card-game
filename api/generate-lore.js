export default async function handler(req, res) {
    // 1. Cabeceras CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Eventos de respaldo inmediato si la IA falla o no hay API Key
    const fallbackExploration = {
        npcType: "warrior",
        description: "Un veterano de la mazmorra te observa en la penumbra: \"Ten cuidado, aventurero... las paredes oyen tus pasos.\"",
        choices: [
            { text: "🗡️ [FUERZA] Avanzar despejando el pasillo", action: "strength" },
            { text: "🚪 Explorar las estancias adyacentes", action: "pass" }
        ]
    };

    const fallbackIntro = {
        story: "EL MAZO DEL DESTINO TE AGUARDA EN LAS PROFUNDIDADES. PREPARA TU ACERO Y ADÉNTRATE EN LAS SOMBRAS."
    };

    try {
        // 2. Parseo seguro del cuerpo de la petición
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) { body = {}; }
        }
        body = body || {};

        const { type, className, dungeonLevel } = body;
        const apiKey = process.env.GROQ_API_KEY;

        // Si no hay API Key en Vercel, responder con éxito pero datos de respaldo
        if (!apiKey) {
            console.warn("GROQ_API_KEY no encontrada en las variables de entorno.");
            return res.status(200).json(type === 'exploration' ? fallbackExploration : fallbackIntro);
        }

        if (type === 'exploration') {
            try {
                const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: [{
                            role: "system",
                            content: "Eres un Dungeon Master de D&D. Devuelve EXCLUSIVAMENTE un objeto JSON sin markdown con este formato: {\"npcType\": \"warrior|mage|rogue\", \"description\": \"texto narrativo con diálogos hablados entre comillas (máx 35 palabras)\", \"choices\": [{\"text\": \"opción 1 con tipo de habilidad entre corchetes [FUERZA], [MAGIA] o [PERSPICACIA]\", \"action\": \"strength|magic|buy|pass\"}, {\"text\": \"opción 2\", \"action\": \"strength|magic|buy|pass\"}, {\"text\": \"opción 3\", \"action\": \"pass\"}]}"
                        }, {
                            role: "user",
                            content: `Genera un encuentro de D&D con un PNJ en la Planta ${dungeonLevel || 1} para la clase ${className || 'Guerrero'}.`
                        }],
                        temperature: 0.8,
                        max_tokens: 200
                    })
                });

                if (!response.ok) return res.status(200).json(fallbackExploration);

                const data = await response.json();
                let content = data.choices?.[0]?.message?.content?.trim();
                content = content.replace(/```json/g, '').replace(/```/g, '').trim();
                return res.status(200).json(JSON.parse(content));
            } catch (err) {
                return res.status(200).json(fallbackExploration);
            }
        }

        // LORE INICIAL DE CLASE
        try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [{
                        role: "system",
                        content: "Eres un narrador de D&D. Genera introducciones cortas y épicas (máximo 35 palabras) en español sin markdown."
                    }, {
                        role: "user",
                        content: `Escribe una frase narrativa de inicio para un héroe ${className || 'Guerrero'}.`
                    }],
                    temperature: 0.7,
                    max_tokens: 100
                })
            });

            if (!response.ok) return res.status(200).json(fallbackIntro);

            const data = await response.json();
            const story = data.choices?.[0]?.message?.content?.trim() || fallbackIntro.story;
            return res.status(200).json({ story });
        } catch (err) {
            return res.status(200).json(fallbackIntro);
        }

    } catch (criticalError) {
        // Captura global: NUNCA responder con 500
        console.error("Error crítico en serverless function:", criticalError);
        return res.status(200).json(fallbackExploration);
    }
}