const VILLAIN_STORAGE_KEY = "mundo_oscuro_villains_v1";

export const dialogueParams = new URLSearchParams(window.location.search);
export const WORLD_SCENE_STORAGE_KEY = "mundo_oscuro_scene_v1";

export const companionName = dialogueParams.get("companionName")?.trim() || "HÉROE";
const requestedCompanionPortrait = dialogueParams.get("companionPortrait") || "";
export const companionAvatar = /^img\/[A-Za-z0-9/_-]+\.(png|jpe?g|webp)$/i.test(requestedCompanionPortrait)
    ? requestedCompanionPortrait
    : "🧭";

let companionsFromSave = [];
try {
    companionsFromSave = JSON.parse(dialogueParams.get("companions") || "[]");
} catch (error) {
    companionsFromSave = [];
}
if (!Array.isArray(companionsFromSave)) companionsFromSave = [];

export function cargarMemoriaVillanos() {
    try {
        const raw = localStorage.getItem(VILLAIN_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return {
            prisionera: Boolean(parsed.prisionera),
            prisionero: Boolean(parsed.prisionero),
            lastVillainRole: parsed.lastVillainRole || null
        };
    } catch (e) {
        return { prisionera: false, prisionero: false, lastVillainRole: null };
    }
}

export function guardarMemoriaVillanos(state) {
    try {
        localStorage.setItem(VILLAIN_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
}

export const personajesCelda = {
    prisionera: {
        rol: "prisionera",
        nombre: "La Prisionera",
        nombreRol: "Lyra",
        imgCelda: "img/moscuro/prisionera_celda.jpg",
        imgHabla: "img/moscuro/prisionera_habla.jpg",
        imgLibre: "img/moscuro/prisionera_libre.jpg",
        imgPerfil: "img/moscuro/prisionera_perfil.jpg",
        saludoLoco: "«¿Un visitante en el barro? ¡Qué divertido! ¿Acaso crees que la piedra no recuerda quién camina sobre ella? ¿O es que vienes a perderte también?»",
        preguntasMundoOscuro: [
            "«¿Sabes qué hay detrás de los monolitos? ¿Y si te dijera que la niebla no oculta nada... sino que te borra a ti?»",
            "«¿Por qué todos buscan salidas en un lugar que respira? ¿Has oído alguna vez latir los barrotes cuando se apaga la vela?»"
        ],
        peticionSalida: "«¿Me vas a dejar aquí riéndome con las sombras? ¡Abre este cerrojo y dime... qué harás cuando veas de qué lado estoy?»",
        respuestaAliado: "«¡Ja! ¡Salió el cerrojo! Me llamo Lyra... aunque los nombres aquí son solo cascabeles en la niebla. ¡Vamos, muévete antes de que la oscuridad nos alcance!»",
        respuestaVillanoLiberado: "«¡Qué inocencia la tuya! ¿De verdad creías que una sonrisa tras estas rejas era inocente? ¡Pronto verás el precio de abrirme!»",
        historiaAnciano: "«¡Cuidado con esa mujer! Hace inviernos jugaba con las mentes de los viajeros junto a las fisuras: finge locura y devuelve preguntas para confundir a su presa antes de saquearla. No creas que ha desaparecido para siempre... en el Mundo Oscuro los embaucadores siempre vuelven a acechar.»",
        reencuentroAdvertido: "«¡Mira quién vuelve a tropezar! Ya sabes lo que soy... ¿y aun así creías que esta vez tendrías el control?»"
    },
    prisionero: {
        rol: "prisionero",
        nombre: "El Prisionero",
        nombreRol: "Kaelen",
        imgCelda: "img/moscuro/prisionero_celda.jpg",
        imgHabla: "img/moscuro/prisionero_habla.jpg",
        imgMisterio: "img/moscuro/prisionero_habla_misterio.jpg",
        imgLibre: "img/moscuro/prisionero_libre.jpg",
        imgPerfil: "img/moscuro/prisionero_perfil.jpg",
        loreSerio: "«Este dominio existió antes que los mapas del reino. Las piedras guardan antiguos juramentos y los ecos despiertan a quienes no saben guardar silencio.»",
        peticionSalida: "«El hierro me retiene, pero mis ojos han leído estos muros más tiempo del que imaginas. Libérame... y sabrás si mi paso es tu escudo o tu ruina.»",
        respuestaAliado: "«El cerrojo ha cedido. Mi nombre es Kaelen. A partir de este instante, mi filo camina contigo hasta que las sombras caigan.»",
        respuestaVillanoLiberado: "«Has cometido un error antiguo, forastero. Algunos encerrados aquí no fueron víctimas... sino quienes abrieron las grietas.»",
        historiaAnciano: "«Ese hombre no fue encerrado por error. Antaño sirvió a los señores de la grieta y robó llaves y reliquias para abrir los umbrales prohibidos. Si te ha traicionado, mantén los ojos abiertos: estos dominios retuercen los caminos y volveréis a cruzaros.»",
        reencuentroAdvertido: "«Ya conoces mi filo y mi silencio, forastero. Esta vez vienes advertido... pero la sombra sigue siendo mía.»"
    }
};

export const missionObjectives = [
    {
        key: "portalCrossed",
        title: "Cruzar el portalón",
        description: "Entraste en el Mundo Oscuro y comenzaste a seguir las huellas."
    },
    {
        key: "royalClueFound",
        title: "Encontrar una pista real",
        description: "Busca la cinta morada con el sello real en el nicho."
    },
    {
        key: "guardianPassed",
        title: "Superar la guardia del minotauro",
        description: "Engaña al guardián con un eco o véncelo en combate."
    },
    {
        key: "princessTrailFound",
        title: "Confirmar el rastro de la princesa",
        description: "Encuentra el broche real al otro lado del laberinto."
    }
];

const savedScene = (() => {
    try {
        return JSON.parse(localStorage.getItem(WORLD_SCENE_STORAGE_KEY) || "null");
    } catch (error) {
        return null;
    }
})();

export const state = {
    currentNodeIndex: Number.isInteger(savedScene?.currentNodeIndex) ? savedScene.currentNodeIndex : 0,
    inventario: Array.isArray(savedScene?.inventario) ? savedScene.inventario : [],
    objetoSeleccionado: savedScene?.objetoSeleccionado || null,
    llaveCogida: Boolean(savedScene?.llaveCogida),
    puertaAbierta: Boolean(savedScene?.puertaAbierta),
    anguloInteriorAlternativo: false,
    minotaurCombatRequested: false,
    missionProgress: {
        portalCrossed: savedScene?.missionProgress?.portalCrossed
            ?? (dialogueParams.get("missionPortalCrossed") !== "0"),
        royalClueFound: savedScene?.missionProgress?.royalClueFound
            ?? (dialogueParams.get("missionRoyalClueFound") === "1"),
        guardianPassed: savedScene?.missionProgress?.guardianPassed
            ?? (dialogueParams.get("missionGuardianPassed") === "1"),
        guardianDefeated: savedScene?.missionProgress?.guardianDefeated
            ?? (dialogueParams.get("missionGuardianDefeated") === "1"),
        princessTrailFound: savedScene?.missionProgress?.princessTrailFound
            ?? (dialogueParams.get("missionPrincessTrailFound") === "1")
    },
    minotaurClueFound: false,
    minotaurDistracted: Boolean(savedScene?.minotaurDistracted),
    minotaurDefeated: Boolean(savedScene?.minotaurDefeated),
    villainMemory: cargarMemoriaVillanos(),
    encuentroCeldaActual: null,
    celdaLiberada: false,
    aliadosGrupo: Array.isArray(savedScene?.aliadosGrupo)
        ? savedScene.aliadosGrupo
        : companionsFromSave,
    traicionPendiente: false,
    traicionEjecutada: false
};

state.minotaurClueFound = savedScene?.minotaurClueFound
    ?? state.missionProgress.royalClueFound;
state.minotaurDistracted = savedScene?.minotaurDistracted
    ?? (state.missionProgress.guardianPassed && !state.missionProgress.guardianDefeated);
state.minotaurDefeated = savedScene?.minotaurDefeated
    ?? state.missionProgress.guardianDefeated;

export function guardarEstadoMundoOscuro() {
    try {
        localStorage.setItem(WORLD_SCENE_STORAGE_KEY, JSON.stringify({
            currentNodeIndex: state.currentNodeIndex,
            inventario: state.inventario,
            objetoSeleccionado: state.objetoSeleccionado,
            llaveCogida: state.llaveCogida,
            puertaAbierta: state.puertaAbierta,
            anguloInteriorAlternativo: state.anguloInteriorAlternativo,
            missionProgress: state.missionProgress,
            minotaurClueFound: state.minotaurClueFound,
            minotaurDistracted: state.minotaurDistracted,
            minotaurDefeated: state.minotaurDefeated,
            villainMemory: state.villainMemory,
            encuentroCeldaActual: state.encuentroCeldaActual,
            celdaLiberada: state.celdaLiberada,
            aliadosGrupo: state.aliadosGrupo,
            traicionPendiente: state.traicionPendiente,
            traicionEjecutada: state.traicionEjecutada
        }));
    } catch (error) {}
}

export function sortearEncuentroCelda() {
    if (state.celdaLiberada) return;
    const elegirPrisionera = Math.random() < 0.5;
    const base = elegirPrisionera ? personajesCelda.prisionera : personajesCelda.prisionero;
    const yaAdvertidoDeEsteVillano = Boolean(state.villainMemory[base.rol]);
    const esHeroe = Math.random() < 0.5;

    state.encuentroCeldaActual = {
        ...base,
        alineacion: esHeroe ? "heroe" : "villano",
        yaAdvertido: !esHeroe && yaAdvertidoDeEsteVillano,
        preguntaIdx: 0
    };
}

export function obtenerVillanoParaAnciano() {
    if (state.encuentroCeldaActual && state.encuentroCeldaActual.alineacion === "villano") {
        return personajesCelda[state.encuentroCeldaActual.rol];
    }
    if (state.villainMemory.lastVillainRole && personajesCelda[state.villainMemory.lastVillainRole]) {
        return personajesCelda[state.villainMemory.lastVillainRole];
    }
    if (state.villainMemory.prisionero) return personajesCelda.prisionero;
    if (state.villainMemory.prisionera) return personajesCelda.prisionera;
    return null;
}
