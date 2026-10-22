module.exports = async function handler(req, res){
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { type, className, dungeonLevel } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (type === 'exploration') {
        const defaultEvents = [
            {
                npcType: "mage",
                description: "Un anciano hechicero atrapado en grilletes de maná te dice: \"¡Joven aventurero, rompe el sello arcano y compartiré el conocimiento antiguo contigo!\"",
                choices: [
                    { text: "✨ [MAGIA] Canalizar energía para romper los grilletes", action: "magic" },
                    { text: "🗡️ [FUERZA] Golpear las cadenas con tu arma", action: "strength" },
                    { text: "🚪 Ignorar al hechicero y continuar tu camino", action: "pass" }
                ]
            },
            {
                npcType: "rogue",
                description: "Un duende comerciante encaramado en un cofre susurra: \"Tengo pociones de vida y artefactos raros... si tienes suficiente oro en tu bolsa.\"",
                choices: [
                    { text: "💰 Comprar poción de sanación completa (100 oro)", action: "buy" },
                    { text: "🗡️ [PERSPICACIA] Intentar intimidar al duende", action: "strength" },
                    { text: "🚶 Ignorar sus ofertas y seguir adelante", action: "pass" }
                ]
            }
        ];

        const fallback = defaultEvents[Math.floor(Math.random() * defaultEvents.length)];
        if (!apiKey) return res.status(200).json(fallback);

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
                        content: `Genera un encuentro de rol D&D con un PNJ o criatura parlante en la Planta ${dungeonLevel} para un héroe de clase ${className}.`
                    }],
                    temperature: 0.8,
                    max_tokens: 200
                })
            });

            const data = await response.json();
            let content = data.choices?.[0]?.message?.content?.trim();
            content = content.replace(/```json/g, '').replace(/```/g, '').trim();
            return res.status(200).json(JSON.parse(content));
        } catch (error) {
            return res.status(200).json(fallback);
        }
    }

    // Lore Inicial
    const fallbacksIntro = {
        "Guerrero": "FORJADO EN MIL BATALLAS, TU ACERO BUSCA SU MAYOR DESAFÍO. EL MAZO ANCESTRAL TE ESPERA EN LAS PROFUNDIDADES.",
        "Maga Arcana": "LOS ANCIANOS TOMOS PROHIBIDOS PREDIJERON TU LLEGADA. CANALIZA EL MANÁ MÍSTICO Y RECLAMA TU PODER.",
        "Pícaro": "EN LOS CALLEJONES SE HABLA DEL MAYOR TESORO DE LA MAZMORRA. BURLA A LA MUERTE Y DESPOJA TUS SECRETOS."
    };

    if (!apiKey) return res.status(200).json({ story: fallbacksIntro[className] || fallbacksIntro["Guerrero"] });

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "openai/gpt-oss-120b",
                messages: [{
                    role: "system",
                    content: "Eres un narrador de D&D. Genera introducciones cortas y épicas (máximo 35 palabras) en español sin markdown."
                }, {
                    role: "user",
                    content: `Escribe una frase narrativa de inicio para un héroe ${className}.`
                }],
                temperature: 0.7,
                max_tokens: 100
            })
        });

        const data = await response.json();
        const story = data.choices?.[0]?.message?.content?.trim() || fallbacksIntro[className];
        return res.status(200).json({ story });
    } catch (error) {
        return res.status(200).json({ story: fallbacksIntro[className] || fallbacksIntro["Guerrero"] });
    }
}