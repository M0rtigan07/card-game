export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { type, className, dungeonLevel } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    // --- MODO 1: GENERACIÓN DE EVENTOS DE EXPLORACIÓN RPG ---
    if (type === 'exploration') {
        const defaultEvents = {
            "Guerrero": {
                description: `Te encuentras frente a los restos de una barricada sagrada en la Planta ${dungeonLevel}. Un altar de guerra abandonado brilla débilmente.`,
                choices: [
                    { text: "🗡️ Rezar al dios de la guerra para bendecir tu acero", action: "investigate" },
                    { text: "🛡️ Destruir la barricada y avanzar a la fuerza", action: "cautious" },
                    { text: "⛺ Acampar en la sombra para curar heridas", action: "rest" }
                ]
            },
            "Maga Arcana": {
                description: `Una grieta abisal llena de runas de maná fluctuante bloquea el pasillo de la Planta ${dungeonLevel}. Sientes una pulsación mística.`,
                choices: [
                    { text: "✨ Absorber la energía rúnica para restaurar poder", action: "investigate" },
                    { text: "🔮 Canalizar un escudo arcano y rodear la grieta", action: "cautious" },
                    { text: "⛺ Meditar junto al vórtice místico", action: "rest" }
                ]
            },
            "Pícaro": {
                description: `Descubres un cofre de hierro reforzado con trampas visibles en la estancia oculta de la Planta ${dungeonLevel}.`,
                choices: [
                    { text: "🗝️ Intentar forzar la cerradura con tus ganzúas", action: "investigate" },
                    { text: "🗡️ Ignorar el cofre y moverte sigilosamente", action: "cautious" },
                    { text: "💰 Registrar los cadáveres cercanos en busca de oro", action: "rest" }
                ]
            }
        };

        const fallbackEvent = defaultEvents[className] || defaultEvents["Guerrero"];

        if (!apiKey) return res.status(200).json(fallbackEvent);

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
                        content: "Eres un Master de rol de fantasía oscura estilo 16-bits. Devuelve EXCLUSIVAMENTE un objeto JSON válido con este formato exacto, sin markdown ni formato extra: {\"description\": \"texto descriptivo de la estancia/evento (máx 35 palabras)\", \"choices\": [{\"text\": \"opción 1 con emoji\", \"action\": \"investigate\"}, {\"text\": \"opción 2 con emoji\", \"action\": \"cautious\"}, {\"text\": \"opción 3 con emoji\", \"action\": \"rest\"}]}"
                    }, {
                        role: "user",
                        content: `Genera un encuentro/evento estratégico de exploración para un héroe de clase ${className} explorando la Planta ${dungeonLevel} de la mazmorra.`
                    }],
                    temperature: 0.8,
                    max_tokens: 180
                })
            });

            const data = await response.json();
            let content = data.choices?.[0]?.message?.content?.trim();
            content = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const eventData = JSON.parse(content);
            return res.status(200).json(eventData);
        } catch (error) {
            return res.status(200).json(fallbackEvent);
        }
    }

    // --- MODO 2: HISTORIA DE INTRODUCCIÓN DEL HÉROE ---
    const fallbacksIntro = {
        "Guerrero": "FORJADO EN MIL BATALLAS, TU ACERO BUSCA SU MAYOR DESAFÍO. EL MAZO DEL DESTINO YACE EN LO MÁS PROFUNDO DE LAS CATACUMBAS. ¡DEMUESTRA TU VALOR Y ADÉNTRATE EN LAS SOMBRAS!",
        "Maga Arcana": "LOS ANCIANOS TOMOS PROHIBIDOS PREDIJERON TU LLEGADA. LAS ENERGÍAS ARCANAS MÍSTICAS RESONAN CON EL MAZO ANCESTRAL. CANALIZA TU MANÁ Y RECLAMA EL PODER PERDIDO.",
        "Pícaro": "EN LOS CALLEJONES OSCUROS SE HABLA DEL MAYOR TESORO JAMÁS CONOCIDO. TUS DAGAS MÁGICAS ESTÁN LISTAS. BURLA A LA MUERTE Y DESPOJA A LA MAZMORRA DE SUS SECRETOS."
    };

    if (!apiKey) {
        return res.status(200).json({ story: fallbacksIntro[className] || fallbacksIntro["Guerrero"] });
    }

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
                    content: "Eres un narrador de juegos RPG retro de 16-bits. Genera introducciones cortas, épicas y directas en español. Usa solo letras estándar. Sin formato markdown."
                }, {
                    role: "user",
                    content: `Escribe una frase narrativa épica (máximo 35 palabras) para un héroe de clase ${className} que entra a explorar la mazmorra 'El Mazo del Destino'.`
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