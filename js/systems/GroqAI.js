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
}