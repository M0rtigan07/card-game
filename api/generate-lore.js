export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { className } = req.body;
    const apiKey = process.env.GROQ_API_KEY; // Se lee del entorno seguro de Vercel

    // Fallbacks si no hay API Key configurada
    const fallbackLores = {
        "Guerrero": "LAS LEYENDAS HABLAN DE TU ESPADA. TRAS AÑOS DE BATALLAS, EL MAZO DEL DESTINO RECLAMA TU VALOR EN LAS CATACUMBAS. DESENFAÑA TU ACERO, LA MAZMORRA TE ESPERA...",
        "Maga Arcana": "LOS TOMOS PROHIBIDOS SUSURRABAN UN PRESAGIO SOBRE EL MAZO ANCESTRAL. TU DOMINIO SOBRE EL MANÁ TE HA CONDUCIDO HASTA LOS ABISMOS. SIENTE EL PULSO DE LA MAGIA...",
        "Pícaro": "EL MAZO DEL DESTINO ES CONSIDERADO LA MAYOR DE LAS FORTUNAS. ESCONDIDO ENTRE LAS SOMBRAS, DESENFUNDA TUS DAGAS Y PREPÁRATE PARA EL SAQUEO..."
    };

    if (!apiKey) {
        return res.status(200).json({ story: fallbackLores[className] || fallbackLores["Guerrero"] });
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
                    role: "user",
                    content: `Escribe una breve introducción narrativa épica de fantasía oscura y estilo RPG retro (máximo 35 palabras) para un héroe de clase ${className} que entra en las profundidades de las ruinas a buscar 'El Mazo del Destino'. En español y en mayúsculas.`
                }],
                max_tokens: 100
            })
        });

        const data = await response.json();
        const story = data.choices?.[0]?.message?.content || fallbackLores[className];
        return res.status(200).json({ story });
    } catch (error) {
        return res.status(200).json({ story: fallbackLores[className] || fallbackLores["Guerrero"] });
    }
}