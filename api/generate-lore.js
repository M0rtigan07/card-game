export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { className } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    // Historias refinadas de respaldo
    const fallbacks = {
        "Guerrero": "FORJADO EN MIL BATALLAS, TU ACERO BUSCA SU MAYOR DESAFÍO. EL MAZO DEL DESTINO YACE EN LO MÁS PROFUNDO DE LAS CATACUMBAS. ¡DEMUESTRA TU VALOR Y ADÉNTRATE EN LAS SOMBRAS!",
        "MAGA ARCANA": "LOS ANCIANOS TOMOS PROHIBIDOS PREDIJERON TU LLEGADA. LAS ENERGÍAS ARCANAS MÍSTICAS RESONAN CON EL MAZO ANCESTRAL. CANALIZA TU MANÁ Y RECLAMA EL PODER PERDIDO.",
        "Maga Arcana": "LOS ANCIANOS TOMOS PROHIBIDOS PREDIJERON TU LLEGADA. LAS ENERGÍAS ARCANAS MÍSTICAS RESONAN CON EL MAZO ANCESTRAL. CANALIZA TU MANÁ Y RECLAMA EL PODER PERDIDO.",
        "Pícaro": "EN LOS CALLEJONES OSCUROS SE HABLA DEL MAYOR TESORO JAMÁS CONOCIDO. LAS DAGA MÁGICAS ESTÁN LISTAS. BURLA A LA MOVERTE Y DESPOJA A LA MAZMORRA DE SUS SECRETOS."
    };

    if (!apiKey) {
        return res.status(200).json({ story: fallbacks[className] || fallbacks["Guerrero"] });
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
                    content: "Eres un narrador de juegos RPG retro de 16-bits. Genera introducciones cortas, épicas y directas en español. Usa solo letras estándar y signos de puntuación básicos. No uses caracteres raros ni formato markdown."
                }, {
                    role: "user",
                    content: `Escribe una frase narrativa épica e inspiradora (máximo 35 palabras) para la introducción de un héroe de clase ${className} que entra a explorar la mazmorra 'El Mazo del Destino'.`
                }],
                temperature: 0.7,
                max_tokens: 100
            })
        });

        const data = await response.json();
        const story = data.choices?.[0]?.message?.content?.trim() || fallbacks[className];
        return res.status(200).json({ story });
    } catch (error) {
        return res.status(200).json({ story: fallbacks[className] || fallbacks["Guerrero"] });
    }
}