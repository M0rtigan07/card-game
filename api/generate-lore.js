export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) { body = {}; }
        }
        body = body || {};

        const { type, className = "Guerrero", dungeonLevel = 1, npc, npcName, npcArchetype, action } = body;
        const apiKey = process.env.GROQ_API_KEY;

        // BANCO NARRATIVO RAMIFICADO Y DINÁMICO (FALLBACKS D&D)
        const dndEncounterDatabase = {
            "Guerrero": [
                {
                    npcType: "warrior",
                    description: "Un veterano malherido apoya su espadón en una pira: \"Mi escuadra cayó ante el Capitán Orco... Toma mi escudo o avanza a vengar nuestras vidas.\"",
                    choices: [
                        { text: "🗣️ \"Prometo honor a tus caídos. Guiaré mi acero contra el orco.\"", action: "strength" },
                        { text: "✨ \"Déjame intentar curar tus heridas con vendas de campaña.\"", action: "magic" },
                        { text: "⚔️ \"Examino el pasillo en busca de los orcos. ¡A las armas!\"", action: "combat" }
                    ]
                },
                {
                    npcType: "automata",
                    description: "Un autómata de bronce guardián bloquea el puente de piedra: \"Solo aquellos dignos en el arte del combate atravesarán los portones del rey.\"",
                    choices: [
                        { text: "🗡️ [FUERZA] \"Demostraré mi valía en un duelo honorable.\"", action: "strength" },
                        { text: "💰 \"Acepta este tributo de oro y déjame pasar sin sangre.\"", action: "buy" },
                        { text: "🚪 \"Buscaré un paso subterráneo alternativo.\"", action: "pass" }
                    ]
                }
            ],
            "Maga Arcana": [
                {
                    npcType: "mage",
                    description: "El fantasma de una archimaga flota sobre un glifo rúnico parpadeante: \"El flujo del maná en esta planta está corrupto... Rompe el nexo antes de que devore tu mente.\"",
                    choices: [
                        { text: "✨ [ARCANO] \"Usaré mi canalización para purificar la runa.\"", action: "magic" },
                        { text: "🗣️ \"Dime qué secretos esconde la orden a cambio de ayudarte.\"", action: "strength" },
                        { text: "⚔️ \"Ese nexo alberga una criatura sombría. ¡A prepararse!\"", action: "combat" }
                    ]
                }
            ],
            "Pícaro": [
                {
                    npcType: "rogue",
                    description: "Un contrabandista encapuchado saca una dula de joyas en las sombras: \"Tengo las llaves del cofre del tesoro real... ¿Nos repartimos el botín o me delatarás?\"",
                    choices: [
                        { text: "💰 [PERSUASIÓN] \"Acepto el trato, pero me llevo el 60%.\"", action: "buy" },
                        { text: "🗡️ [INMERCENARIO] \"Te quitaré las llaves y el saco ahora mismo.\"", action: "strength" },
                        { text: "🚪 \"No me mezclo en asuntos de ladrones torpes.\"", action: "pass" }
                    ]
                }
            ]
        };

        const deepDungeonEncounters = [
            {
                npcType: "mage",
                description: "Un devorador de mentes te observa desde el techo: \"Siento la ambición de tu alma. Entrégame tus recuerdos de la superficie o perece.\"",
                choices: [
                    { text: "✨ [VOLUNTAD] \"Mi mente es una fortaleza inexpugnable.\"", action: "magic" },
                    { text: "⚔️ \"¡Empuño mis cartas y mi acero para destruirte!\"", action: "combat" },
                    { text: "🚪 \"Retrocedo lentamente hacia el pasillo anterior.\"", action: "pass" }
                ]
            }
        ];

        function getSmartFallback() {
            if (dungeonLevel > 3 && Math.random() > 0.4) {
                return deepDungeonEncounters[Math.floor(Math.random() * deepDungeonEncounters.length)];
            }
            const classList = dndEncounterDatabase[className] || dndEncounterDatabase["Guerrero"];
            return classList[Math.floor(Math.random() * classList.length)];
        }

        const fallbackEvent = getSmartFallback();
        const fallbackIntro = {
            story: `EL DESTINO DE ${className.toUpperCase()} ESTÁ FORJADO EN SANGRE Y MANÁ. ADÉNTRATE EN LA PLANTA ${dungeonLevel}.`
        };

        // 💬 MANEJADOR DE DIÁLOGOS DINÁMICOS PARA PNJS (FIJOS Y NUEVOS ARQUETIPOS)
        // 💬 MANEJADOR DE DIÁLOGOS DINÁMICOS PARA PNJS
        if (type === 'npc_interaction') {
            if (!apiKey) {
                return res.status(200).json({ description: "El personaje te observa en silencio en la penumbra..." });
            }

            try {
                let personaPrompt = "Actúa como un habitante misterioso de una mazmorra gótica oscura.";

                if (npc === 'valerius') {
                    personaPrompt = "Actúa como el Conde Valerius, un lord vampiro milenario, aristócrata, extremadamente arrogante, cínico y elegante.";
                } else if (npc === 'barnaby') {
                    personaPrompt = "Actúa como Barnaby el Buhonero, un mercader callejero astuto, precavido, cotilla y un poco cascarrabias.";
                } else if (npc === 'morgana') {
                    personaPrompt = "Actúa como la Bruja Morgana, una hechicera oscura, misteriosa, seductora y enigmática.";
                } else if (npcName && npcArchetype) {
                    personaPrompt = `Actúa como ${npcName}, que es ${npcArchetype}.`;
                }

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
                            content: `${personaPrompt} El jugador de clase ${className} ha realizado la siguiente acción o dicho esto: "${action}". Responde brevemente (máximo 2 líneas) con una frase directa en español metida en el personaje, reaccionando específicamente a lo que acaba de hacer el héroe.`
                        }, {
                            role: "user",
                            content: "Reacciona a la acción del héroe."
                        }],
                        temperature: 0.9, // Subimos un poco la temperatura para que varíe más las respuestas
                        max_tokens: 100
                    })
                });

               /*  if (!response.ok) {
                    return res.status(200).json({ description: "El personaje te mira de reojo sin decir nada." });
                } */

               /*  const data = await response.json();
                const description = data.choices?.[0]?.message?.content?.trim() || "Las sombras ocultan la respuesta de tu interlocutor.";
                return res.status(200).json({ description }); */
            } catch (err) {
                return res.status(200).json({ description: "Un eco sordo ahoga las palabras de tu interlocutor." });
            }
        }

        // EXPLORACIÓN PROCEDURAL
        if (type === 'exploration') {
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
                            content: "Eres un Dungeon Master de D&D. Genera un encuentro conversacional rico donde un PNJ hable directamente usando comillas. Devuelve EXCLUSIVAMENTE un objeto JSON sin markdown: {\"npcType\": \"warrior|mage|rogue\", \"description\": \"diálogo directo del PNJ (máx 35 palabras)\", \"choices\": [{\"text\": \"\\\"🗣️ o ⚔️ Respuesta hablada del héroe entre comillas\\\"\", \"action\": \"strength|magic|buy|combat|pass\"}, {\"text\": \"\\\"opción 2\\\"\", \"action\": \"strength|magic|buy|combat|pass\"}, {\"text\": \"\\\"opción 3\\\"\", \"action\": \"pass\"}]}"
                        }, {
                            role: "user",
                            content: `Genera un encuentro narrativo D&D único e inmersivo en la Planta ${dungeonLevel} para un héroe de clase ${className}.`
                        }],
                        temperature: 0.85,
                        max_tokens: 220
                    })
                });

                if (!response.ok) return res.status(200).json(fallbackEvent);

                const data = await response.json();
                let content = data.choices?.[0]?.message?.content?.trim();
                content = content.replace(/```json/g, '').replace(/```/g, '').trim();
                return res.status(200).json(JSON.parse(content));
            } catch (err) {
                return res.status(200).json(fallbackEvent);
            }
        }

        // LORE INICIAL
        if (!apiKey) return res.status(200).json(fallbackIntro);

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
                        content: "Eres un narrador de D&D. Genera introducciones épicas en español sin markdown."
                    }, {
                        role: "user",
                        content: `Escribe una frase epica narrativa de inicio para un héroe ${className}.`
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
        return res.status(200).json({
            npcType: "warrior",
            description: "Un veterano de la mazmorra te observa en la penumbra: \"Ten cuidado, aventurero... las paredes oyen tus pasos.\"",
            choices: [
                { text: "\"🗡️ [FUERZA] Avanzar despejando el pasillo\"", action: "strength" },
                { text: "\"🚪 Explorar las estancias adyacentes\"", action: "pass" }
            ]
        });
    }
}