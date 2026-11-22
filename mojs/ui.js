
import {
    companionAvatar,
    companionName,
    guardarMemoriaVillanos,
    guardarEstadoMundoOscuro,
    missionObjectives,
    obtenerVillanoParaAnciano,
    sortearEncuentroCelda,
    state
} from "./state.js";

const RETRATO_ANCIANO = "img/moscuro/anciano_perfil.jpg";

let interiorAudioCtx = null;
let interiorOsc1 = null;
let interiorOsc2 = null;
let interiorGain = null;
let companionReplyTimeout = null;

function programarRespuestaCompanero(texto, delayMs) {
    if (companionReplyTimeout) {
        clearTimeout(companionReplyTimeout);
        companionReplyTimeout = null;
    }
    companionReplyTimeout = setTimeout(() => {
        companionReplyTimeout = null;
        mostrarDialogoCompanero(texto);
    }, delayMs);
}

function sincronizarVistaCelda(esVistaCelda) {
    const layer = document.getElementById("static-scene-layer");
    if (!layer) return;
    layer.classList.toggle("is-cell-view", Boolean(esVistaCelda));
}

function obtenerNombreRolAliado(aliado) {
    if (aliado.nombreRol) return aliado.nombreRol;
    if (aliado.rol === "prisionera" || aliado.nombre.toLowerCase().includes("prisionera")) {
        return "Lyra";
    }
    if (aliado.rol === "prisionero" || aliado.nombre.toLowerCase().includes("prisionero")) {
        return "Kaelen";
    }
    return aliado.nombre;
}

function generarInteraccionAliado(aliado) {
    const nombreRol = obtenerNombreRolAliado(aliado);
    const esPrisionera = aliado.rol === "prisionera"
        || aliado.nombre.toLowerCase().includes("prisionera")
        || nombreRol === "Lyra";

    if (esPrisionera) {
        const dialogosLyra = [
            `«Me llamo <b>${nombreRol}</b>... aunque los nombres cambian cuando el eco tiene dientes. ¿Has notado cómo las sombras imitan el paso del que duda?»`,
            `«Soy <b>${nombreRol}</b>. Mira esas piedras: ¿dirías que señalan un camino o que esperan a ver quién se atreve a equivocarse primero?»`
        ];
        const idx = (aliado.interaccionIdx || 0) % dialogosLyra.length;
        aliado.interaccionIdx = idx + 1;
        return {
            nombreDialogo: `${nombreRol} — La Prisionera`,
            textoDialogo: dialogosLyra[idx],
            comentarioGrupo: `«Hablas con <b>${nombreRol}</b> y le sigues el juego de acertijos mientras avanzáis por el Mundo Oscuro.»`
        };
    }

    const dialogosKaelen = [
        `«Mi nombre es <b>${nombreRol}</b>. Conocí el peso de estas cadenas mucho antes de oír vuestros pasos... mantengamos la vista en las sombras.»`,
        `«Llámeme <b>${nombreRol}</b>. Este lugar guarda ecos de antiguos juramentos; no te apartes del rastro y vigila los ángulos muertos.»`
    ];
    const idx = (aliado.interaccionIdx || 0) % dialogosKaelen.length;
    aliado.interaccionIdx = idx + 1;
    return {
        nombreDialogo: `${nombreRol} — El Prisionero`,
        textoDialogo: dialogosKaelen[idx],
        comentarioGrupo: `«Te diriges a <b>${nombreRol}</b> en voz baja; su calma contrasta con la tensión del camino.»`
    };
}

export function setCanvasCursor(claseCursor, canvas) {
    canvas.className = claseCursor;
}

export function actualizarAudioInteriorCabana(activar) {
    try {
        if (activar) {
            if (!interiorAudioCtx) {
                interiorAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (interiorAudioCtx.state === "suspended") {
                interiorAudioCtx.resume();
            }
            if (interiorOsc1) return;

            interiorGain = interiorAudioCtx.createGain();
            interiorGain.gain.setValueAtTime(0.0001, interiorAudioCtx.currentTime);
            interiorGain.gain.exponentialRampToValueAtTime(0.045, interiorAudioCtx.currentTime + 1.4);
            interiorGain.connect(interiorAudioCtx.destination);

            interiorOsc1 = interiorAudioCtx.createOscillator();
            interiorOsc1.type = "sawtooth";
            interiorOsc1.frequency.setValueAtTime(45, interiorAudioCtx.currentTime);

            interiorOsc2 = interiorAudioCtx.createOscillator();
            interiorOsc2.type = "sine";
            interiorOsc2.frequency.setValueAtTime(48.5, interiorAudioCtx.currentTime);

            const lowpass = interiorAudioCtx.createBiquadFilter();
            lowpass.type = "lowpass";
            lowpass.frequency.setValueAtTime(120, interiorAudioCtx.currentTime);

            interiorOsc1.connect(lowpass);
            interiorOsc2.connect(lowpass);
            lowpass.connect(interiorGain);

            interiorOsc1.start();
            interiorOsc2.start();
        } else if (interiorOsc1 && interiorAudioCtx) {
            interiorGain.gain.exponentialRampToValueAtTime(0.0001, interiorAudioCtx.currentTime + 0.7);
            const oscA = interiorOsc1;
            const oscB = interiorOsc2;
            interiorOsc1 = null;
            interiorOsc2 = null;
            setTimeout(() => {
                try { oscA.stop(); oscA.disconnect(); } catch (e) {}
                try { oscB.stop(); oscB.disconnect(); } catch (e) {}
            }, 750);
        }
    } catch (e) {}
}

export function actualizarHUDGrupo() {
    const hud = document.getElementById("party-hud");
    if (!hud) return;

    const chips = [];
    const principalChip = document.createElement("button");
    principalChip.type = "button";
    principalChip.className = "party-member-chip";
    principalChip.title = `Hablar con ${companionName}`;
    if (companionAvatar.startsWith("img/")) {
        const img = document.createElement("img");
        img.className = "party-member-avatar";
        img.src = companionAvatar;
        img.alt = companionName;
        img.onerror = () => img.remove();
        principalChip.appendChild(img);
    } else {
        const fb = document.createElement("span");
        fb.className = "party-member-fallback";
        fb.textContent = companionAvatar;
        principalChip.appendChild(fb);
    }
    const nameSpan = document.createElement("span");
    nameSpan.textContent = companionName;
    principalChip.appendChild(nameSpan);
    principalChip.addEventListener("click", () => {
        const nombresAliados = state.aliadosGrupo.map(a => a.nombreRevelado || obtenerNombreRolAliado(a));
        const frase = nombresAliados.length > 0
            ? `«Mantengamos la atención, ${nombresAliados.join(" y ")}. Cada rincón de este lugar esconde una trampa o una pista.»`
            : "«Sigamos avanzando con cautela. Este lugar no perdona los descuidos.»";
        mostrarDialogo(companionName, companionAvatar, frase, "🧭");
    });
    chips.push(principalChip);

    state.aliadosGrupo.forEach(aliado => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "party-member-chip is-ally";
        const etiquetaActual = aliado.nombreRevelado || aliado.nombre;
        chip.title = `Hablar con ${etiquetaActual}`;

        if (aliado.imgPerfil) {
            const img = document.createElement("img");
            img.className = "party-member-avatar";
            img.src = aliado.imgPerfil;
            img.alt = etiquetaActual;
            img.onerror = () => img.remove();
            chip.appendChild(img);
        }
        const label = document.createElement("span");
        label.textContent = etiquetaActual;
        chip.appendChild(label);

        chip.addEventListener("click", () => {
            const interaccion = generarInteraccionAliado(aliado);
            const nombreRol = obtenerNombreRolAliado(aliado);
            aliado.nombreRol = nombreRol;
            aliado.nombreRevelado = nombreRol;
            guardarEstadoMundoOscuro();
            actualizarHUDGrupo();

            mostrarDialogo(interaccion.nombreDialogo, aliado.imgPerfil, interaccion.textoDialogo, "🛡️");
            document.getElementById("text-box").innerHTML =
                `<b>Charla con ${nombreRol}:</b> ${interaccion.comentarioGrupo}`;
        });

        chips.push(chip);
    });

    hud.replaceChildren(...chips);
}

export function mostrarDialogo(nombre, avatar, texto, fallbackEmoji = "🧭") {
    document.getElementById("dialogue-speaker").innerText = nombre;
    const avatarImage = document.getElementById("dialogue-avatar-image");
    const avatarFallback = document.getElementById("dialogue-avatar-fallback");
    if (avatar && avatar.startsWith("img/")) {
        avatarImage.src = avatar;
        avatarImage.alt = nombre;
        avatarImage.hidden = false;
        avatarFallback.hidden = true;
        avatarImage.onerror = () => {
            avatarImage.hidden = true;
            avatarFallback.innerText = fallbackEmoji;
            avatarFallback.hidden = false;
        };
    } else {
        avatarImage.removeAttribute("src");
        avatarImage.hidden = true;
        avatarFallback.innerText = avatar || fallbackEmoji;
        avatarFallback.hidden = false;
    }
    document.getElementById("dialogue-text").innerHTML = texto;
    document.getElementById("dialogue-box").style.display = "flex";
}

export function mostrarDialogoCompanero(texto) {
    mostrarDialogo(companionName, companionAvatar, texto, "🧭");
}

export function mostrarGuiaAnciano(mensajeGuia, textoHud) {
    mostrarDialogo("El Anciano Guía", RETRATO_ANCIANO, mensajeGuia, "🧙‍♂️");
    if (textoHud) {
        document.getElementById("text-box").innerHTML = textoHud;
    }
}

export function cerrarDialogo() {
    document.getElementById("dialogue-box").style.display = "none";
}

export function cerrarMenuNPC() {
    document.getElementById("npc-menu").style.display = "none";
}

export function mostrarOpcionesLaberinto(options) {
    const list = document.createElement("div");
    list.className = "node-choice-list";
    options.forEach(({ label, action }) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "node-choice-button";
        button.textContent = label;
        button.addEventListener("click", action);
        list.appendChild(button);
    });
    document.getElementById("text-box").appendChild(list);
}

function crearIconoCintaMorada() {
    const svgNamespace = "http://www.w3.org/2000/svg";
    const icon = document.createElementNS(svgNamespace, "svg");
    icon.setAttribute("viewBox", "0 0 32 32");
    icon.setAttribute("width", "34");
    icon.setAttribute("height", "34");
    icon.setAttribute("aria-hidden", "true");

    const paths = [
        "M14 14C8 5 2 9 6 15c2 4 6 4 11 1z",
        "M18 14c6-9 12-5 8 1-2 4-6 4-11 1z",
        "M14 17 8 28l7-3 2 6 4-12z",
        "M18 17 24 28l-7-3-2 6-4-12z"
    ];
    paths.forEach((shape, index) => {
        const path = document.createElementNS(svgNamespace, "path");
        path.setAttribute("d", shape);
        path.setAttribute("fill", index < 2 ? "#a653d2" : "#7f32ad");
        path.setAttribute("stroke", "#e7c2ff");
        path.setAttribute("stroke-width", "1.2");
        path.setAttribute("stroke-linejoin", "round");
        icon.appendChild(path);
    });
    const knot = document.createElementNS(svgNamespace, "circle");
    knot.setAttribute("cx", "16");
    knot.setAttribute("cy", "16");
    knot.setAttribute("r", "3");
    knot.setAttribute("fill", "#d397f1");
    icon.appendChild(knot);
    return icon;
}

export function actualizarInventario() {
    for (let i = 0; i < 3; i++) {
        const slot = document.getElementById(`slot-${i}`);
        if (state.inventario[i]) {
            slot.replaceChildren();
            if (state.inventario[i].id === "cinta-real") {
                slot.appendChild(crearIconoCintaMorada());
            } else {
                slot.textContent = state.inventario[i].icono;
            }
            slot.title = state.inventario[i].nombre;
        } else {
            slot.replaceChildren();
            slot.title = "Vacío";
        }
    }
}

export function actualizarDiarioMision() {
    const completedCount = missionObjectives
        .filter(objective => state.missionProgress[objective.key]).length;
    const currentIndex = missionObjectives
        .findIndex(objective => !state.missionProgress[objective.key]);
    const percentage = Math.round(completedCount / missionObjectives.length * 100);
    const badge = document.getElementById("mission-count-badge");
    const progressTrack = document.getElementById("mission-progress-track");
    const progressBar = document.getElementById("mission-progress-bar");
    const list = document.getElementById("mission-objectives");

    badge.textContent = `${completedCount}/${missionObjectives.length}`;
    progressTrack.setAttribute("aria-valuemax", String(missionObjectives.length));
    progressTrack.setAttribute("aria-valuenow", String(completedCount));
    progressBar.style.width = `${percentage}%`;
    document.getElementById("mission-progress-count").textContent =
        `${completedCount} / ${missionObjectives.length} objetivos completados`;
    document.getElementById("mission-summary").textContent =
        completedCount === missionObjectives.length
            ? "Has atravesado el laberinto y confirmado que la hija del rey pasó por aquí."
            : "Las huellas de la hija del rey continúan dentro del laberinto. Sigue reuniendo pistas.";

    const nextObjective = missionObjectives[currentIndex];
    document.getElementById("mission-next").textContent = nextObjective
        ? `Siguiente paso: ${nextObjective.title}.`
        : "El rastro conduce más allá de las ruinas. La búsqueda continúa.";

    const entries = missionObjectives.map((objective, index) => {
        const completed = state.missionProgress[objective.key];
        const current = index === currentIndex;
        const item = document.createElement("li");
        item.className = `mission-objective${completed ? " is-complete" : ""}${current ? " is-current" : ""}`;
        if (current) item.setAttribute("aria-current", "step");

        const mark = document.createElement("span");
        mark.className = "mission-step-mark";
        mark.setAttribute("aria-hidden", "true");
        mark.textContent = completed ? "✓" : String(index + 1);

        const copy = document.createElement("div");
        copy.className = "mission-objective-copy";
        const title = document.createElement("h3");
        title.textContent = objective.title;
        const description = document.createElement("p");
        description.textContent = objective.description;
        copy.append(title, description);

        const status = document.createElement("span");
        status.className = "mission-objective-status";
        status.textContent = completed ? "Completado" : current ? "En curso" : "Pendiente";

        item.append(mark, copy, status);
        return item;
    });
    list.replaceChildren(...entries);
}

export function reportMissionProgress() {
    guardarEstadoMundoOscuro();
    actualizarDiarioMision();
    if (window.parent === window) return;

    const targetOrigin = window.location.origin === "null" ? "*" : window.location.origin;
    window.parent.postMessage(
        { type: "dark-world:mission-progress", progress: { ...state.missionProgress } },
        targetOrigin
    );
}

export function prepararDiarioMision() {
    const toggle = document.getElementById("journal-toggle");
    const journal = document.getElementById("mission-journal");
    toggle.addEventListener("click", () => {
        actualizarDiarioMision();
        journal.showModal();
        toggle.setAttribute("aria-expanded", "true");
    });
    document.getElementById("journal-close").addEventListener("click", () => {
        journal.close();
        toggle.setAttribute("aria-expanded", "false");
    });
    journal.addEventListener("cancel", () => toggle.setAttribute("aria-expanded", "false"));
    journal.addEventListener("close", () => toggle.setAttribute("aria-expanded", "false"));
}

export function prepararPergaminoAntiguo() {
    const scrollDialog = document.getElementById("ancient-scroll-dialog");
    const scrollClose = document.getElementById("scroll-close");
    scrollClose.addEventListener("click", () => scrollDialog.close());
}

export function aplicarImagenCeldaActual() {
    if (!state.encuentroCeldaActual) return;
    sincronizarVistaCelda(true);
    const img = document.getElementById("static-scene-image");
    if (!img) return;
    img.src = state.celdaLiberada
        ? state.encuentroCeldaActual.imgLibre
        : state.encuentroCeldaActual.imgCelda;
    img.onerror = () => {
        img.src = "img/moscuro/rincon-oscuro.jpg";
        img.onerror = null;
    };
}

function notificarAliadoAlPadre(aliado) {
    if (window.parent === window) return;
    const targetOrigin = window.location.origin === "null" ? "*" : window.location.origin;
    window.parent.postMessage(
        { type: "dark-world:ally-recruited", ally: aliado },
        targetOrigin
    );
}

export function ejecutarTraicionVillanoSiAplica(motivoTexto, canvas) {
    if (!state.traicionPendiente || state.traicionEjecutada || !state.encuentroCeldaActual) return false;
    state.traicionEjecutada = true;
    state.traicionPendiente = false;

    const objetoRobado = state.inventario.pop();
    if (objetoRobado) {
        if (state.objetoSeleccionado === objetoRobado.id) {
            state.objetoSeleccionado = null;
            if (canvas) setCanvasCursor("cursor-default", canvas);
        }
        for (let i = 0; i < 3; i++) {
            document.getElementById(`slot-${i}`).classList.remove("selected");
        }
        actualizarInventario();
    }

    const detalleRobo = objetoRobado
        ? ` Te ha arrebatado <b>${objetoRobado.nombre}</b> de la alforja antes de desaparecer.`
        : " No llevaba objetos valiosos que robarte, pero te ha dejado malherido.";

    document.getElementById("text-box").innerHTML =
        `<b>¡Traición de ${state.encuentroCeldaActual.nombre}!</b> ${motivoTexto}${detalleRobo}`;
    mostrarDialogo(
        state.encuentroCeldaActual.nombre,
        state.encuentroCeldaActual.imgPerfil,
        "«¡Qué fácil engaña la desesperación! Gracias por abrirme el paso... nos veremos entre las sombras.»",
        "🗡️"
    );
    guardarEstadoMundoOscuro();
    return true;
}

export function registrarUIHandlers(canvas) {
    window.abrirPergaminoAntiguo = function () {
        const scrollDialog = document.getElementById("ancient-scroll-dialog");
        if (scrollDialog && typeof scrollDialog.showModal === "function" && !scrollDialog.open) {
            scrollDialog.showModal();
        }
        document.getElementById("text-box").innerHTML =
            "<b>Pergamino Antiguo:</b> Has desplegado una vieja crónica sobre los orígenes del Mundo Oscuro y sus guardianes de piedra.";
        mostrarDialogoCompanero("Estos escritos hablan de los tiempos anteriores al reino... de cómo se abrió el velo y quiénes vigilan las ruinas.");
    };

    window.cerrarDialogo = cerrarDialogo;
    window.cerrarMenuNPC = cerrarMenuNPC;

    window.accionNPC = function (tipo) {
        cerrarMenuNPC();
        if (tipo === "hablar") {
            const villanoRelacionado = obtenerVillanoParaAnciano();
            if (villanoRelacionado) {
                mostrarDialogo(
                    "Anciano Místico",
                    RETRATO_ANCIANO,
                    `«Habéis cruzado el velo, viajeros...»<br><br>${villanoRelacionado.historiaAnciano}`,
                    "🧙‍♂️"
                );
                document.getElementById("text-box").innerHTML =
                    `<b>El Anciano te advierte sobre ${villanoRelacionado.nombre}:</b> Conoces su pasado traicionero y sabes que puede volver a cruzarse en tu camino.`;

                programarRespuestaCompanero(
                    `Quedamos advertidos sobre ${villanoRelacionado.nombre}. Si volvemos a verle, no bajaremos la guardia.`,
                    12500
                );
                return;
            }

            mostrarDialogo(
                "Anciano Místico",
                RETRATO_ANCIANO,
                "«Habéis cruzado el velo, viajeros. Si queréis cruzar ese portón, necesitaréis la llave que custodian las viejas piedras.»",
                "🧙‍♂️"
            );

            programarRespuestaCompanero(
                "Sus palabras están cargadas de misterio... prestad atención.",
                11000
            );
        } else if (tipo === "examinar") {
            document.getElementById("text-box").innerHTML = "Observas al anciano: su túnica de lino rústico y su bastón nudoso parecen haber resistido siglos a la intemperie de este lugar.";
        }
    };

    window.cambiarAnguloInterior = function () {
        state.anguloInteriorAlternativo = !state.anguloInteriorAlternativo;
        const img = document.getElementById("static-scene-image");
        const noteSpot = document.getElementById("note-hotspot");
        const cellSpot = document.getElementById("cell-hotspot");
        const btn = document.querySelector(".hotspot-btn[onclick='cambiarAnguloInterior()']");
        img.style.opacity = "0.25";
        setTimeout(() => {
            if (state.anguloInteriorAlternativo) {
                if (!state.celdaLiberada && !state.encuentroCeldaActual) {
                    sortearEncuentroCelda();
                }
                aplicarImagenCeldaActual();
                img.alt = `Rincón de rejas con ${state.encuentroCeldaActual?.nombre || "un prisionero"} en la cabaña`;
                if (noteSpot) noteSpot.classList.add("is-hidden");
                if (cellSpot) cellSpot.classList.remove("is-hidden");
                if (btn) btn.textContent = "🕯️ Volver a la Mesa";
                document.getElementById("text-box").innerHTML =
                    `<b>Rincón de Rejas y Antorcha:</b> Tras los barrotes se encuentra <b>${state.encuentroCeldaActual?.nombre || "una figura"}</b>. Haz clic sobre la celda para interactuar.`;
            } else {
                sincronizarVistaCelda(false);
                img.src = "img/moscuro/interior-cabana.jpg";
                img.alt = "Interior oscuro de la cabaña medieval";
                if (noteSpot) noteSpot.classList.remove("is-hidden");
                if (cellSpot) cellSpot.classList.add("is-hidden");
                if (btn) btn.textContent = "🕯️ Mirar Rincón de Rejas";
                document.getElementById("text-box").innerHTML =
                    "<b>El Interior de la Cabaña:</b> Regresas la vista hacia la mesa de madera y el pergamino junto a la vela.";
            }
            img.onload = () => { img.style.opacity = "1"; };
            img.onerror = () => { img.style.opacity = "1"; };
        }, 160);
    };

    window.liberarPersonajeCelda = function () {
        if (!state.encuentroCeldaActual || state.celdaLiberada) return;
        state.celdaLiberada = true;
        cerrarDialogo();

        sincronizarVistaCelda(true);
        const img = document.getElementById("static-scene-image");
        if (img) img.src = state.encuentroCeldaActual.imgLibre;

        if (state.encuentroCeldaActual.alineacion === "heroe") {
            const nombreRol = state.encuentroCeldaActual.nombreRol || obtenerNombreRolAliado(state.encuentroCeldaActual);
            const nuevoAliado = {
                id: `${state.encuentroCeldaActual.rol}-aliado`,
                rol: state.encuentroCeldaActual.rol,
                nombre: state.encuentroCeldaActual.nombre,
                nombreRol,
                nombreRevelado: nombreRol,
                imgPerfil: state.encuentroCeldaActual.imgPerfil
            };
            state.aliadosGrupo.push(nuevoAliado);
            guardarEstadoMundoOscuro();
            actualizarHUDGrupo();
            notificarAliadoAlPadre(nuevoAliado);

            document.getElementById("text-box").innerHTML =
                `<b>¡Nuevo Aliado!</b> Has liberado a <b>${state.encuentroCeldaActual.nombre}</b>, que se presenta como <b>${nombreRol}</b> y se une a tu grupo.`;
            mostrarDialogo(
                `${nombreRol} — ${state.encuentroCeldaActual.nombre}`,
                state.encuentroCeldaActual.imgPerfil,
                state.encuentroCeldaActual.respuestaAliado,
                "🛡️"
            );
        } else {
            state.traicionPendiente = true;
            state.villainMemory[state.encuentroCeldaActual.rol] = true;
            state.villainMemory.lastVillainRole = state.encuentroCeldaActual.rol;
            guardarMemoriaVillanos(state.villainMemory);
            guardarEstadoMundoOscuro();

            document.getElementById("text-box").innerHTML =
                `<b>Celda Abierta:</b> Has sacado de las rejas a <b>${state.encuentroCeldaActual.nombre}</b>. Algo en su actitud resulta inquietante... Quizás el Anciano sepa quién es en realidad.`;
            mostrarDialogo(
                state.encuentroCeldaActual.nombre,
                state.encuentroCeldaActual.imgPerfil,
                state.encuentroCeldaActual.respuestaVillanoLiberado,
                "🗡️"
            );
        }
    };

    window.interactuarPresoCelda = function () {
        if (!state.anguloInteriorAlternativo) return;

        if (!state.encuentroCeldaActual) {
            sortearEncuentroCelda();
        }

        sincronizarVistaCelda(true);
        const img = document.getElementById("static-scene-image");

        if (state.celdaLiberada && state.encuentroCeldaActual.alineacion === "heroe") {
            const nombreRol = state.encuentroCeldaActual.nombreRol || obtenerNombreRolAliado(state.encuentroCeldaActual);
            if (img) img.src = state.encuentroCeldaActual.imgLibre;
            mostrarDialogo(
                `${nombreRol} — ${state.encuentroCeldaActual.nombre}`,
                state.encuentroCeldaActual.imgPerfil,
                state.encuentroCeldaActual.rol === "prisionera"
                    ? `«Soy <b>${nombreRol}</b>... ¿ya estás listo para correr, o te vas a quedar mirando la puerta abierta?»`
                    : `«Soy <b>${nombreRol}</b>. Mantente firme; conozco los ecos de este lugar y no te daré la espalda.»`,
                "🛡️"
            );
            return;
        }

        if (state.celdaLiberada && state.encuentroCeldaActual.alineacion === "villano") {
            if (img) img.src = state.encuentroCeldaActual.imgLibre;
            if (state.traicionPendiente) {
                ejecutarTraicionVillanoSiAplica(
                    `${state.encuentroCeldaActual.nombre} aprovecha tu descuido junto a la celda abierta para asestarte un golpe y huir.`,
                    canvas
                );
            } else {
                mostrarDialogo(
                    state.encuentroCeldaActual.nombre,
                    state.encuentroCeldaActual.imgPerfil,
                    "La celda está vacía. El traidor ya se esfumó entre las sombras.",
                    "🗡️"
                );
            }
            return;
        }

        if (img) {
            img.src = state.encuentroCeldaActual.rol === "prisionera"
                ? state.encuentroCeldaActual.imgHabla
                : (state.encuentroCeldaActual.preguntaIdx % 2 === 1
                    ? state.encuentroCeldaActual.imgMisterio
                    : state.encuentroCeldaActual.imgHabla);
        }

        if (state.encuentroCeldaActual.yaAdvertido) {
            mostrarDialogo(
                state.encuentroCeldaActual.nombre,
                state.encuentroCeldaActual.imgPerfil,
                `${state.encuentroCeldaActual.reencuentroAdvertido}<br><br><i>(Ya conoces su traición gracias a la advertencia del Anciano. Mantén la guardia alta.)</i>`,
                "🗡️"
            );
            document.getElementById("text-box").innerHTML =
                `<b>Reencuentro con ${state.encuentroCeldaActual.nombre} (Advertido):</b> Sabes que es un villano. Puedes vigilar tu alforja o decidir si vuelves a arriesgarte.`;
            mostrarOpcionesLaberinto([
                {
                    label: "🛡️ Mantener distancia y vigilar la alforja",
                    action: () => {
                        cerrarDialogo();
                        if (img) img.src = state.encuentroCeldaActual.imgCelda;
                        document.getElementById("text-box").innerHTML =
                            `<b>Reencuentro con ${state.encuentroCeldaActual.nombre}:</b> Estás advertido y no le das ventaja.`;
                    }
                },
                {
                    label: `🔓 Abrir la celda de todos modos (${state.encuentroCeldaActual.nombre})`,
                    action: () => window.liberarPersonajeCelda()
                }
            ]);
            return;
        }

        if (state.encuentroCeldaActual.rol === "prisionera") {
            const preguntaLore = state.encuentroCeldaActual.preguntasMundoOscuro[
                state.encuentroCeldaActual.preguntaIdx % state.encuentroCeldaActual.preguntasMundoOscuro.length
            ];
            state.encuentroCeldaActual.preguntaIdx += 1;

            mostrarDialogo(
                state.encuentroCeldaActual.nombre,
                state.encuentroCeldaActual.imgPerfil,
                `${state.encuentroCeldaActual.saludoLoco}<br><br>${preguntaLore}<br><br>${state.encuentroCeldaActual.peticionSalida}`,
                "⛓️"
            );
            document.getElementById("text-box").innerHTML =
                `<b>Rincón de Rejas (${state.encuentroCeldaActual.nombre}):</b> Habla con risa nerviosa y mirada desquiciada, respondiendo a tus preguntas con otras preguntas sobre el Mundo Oscuro.`;
        } else {
            state.encuentroCeldaActual.preguntaIdx += 1;
            mostrarDialogo(
                state.encuentroCeldaActual.nombre,
                state.encuentroCeldaActual.imgPerfil,
                `${state.encuentroCeldaActual.loreSerio}<br><br>${state.encuentroCeldaActual.peticionSalida}`,
                "⛓️"
            );
            document.getElementById("text-box").innerHTML =
                `<b>Rincón de Rejas (${state.encuentroCeldaActual.nombre}):</b> Te observa con gravedad y misterio desde tras los barrotes.`;
        }

        mostrarOpcionesLaberinto([
            {
                label: `🔓 Ayudar a salir de la celda (${state.encuentroCeldaActual.nombre})`,
                action: () => window.liberarPersonajeCelda()
            },
            {
                label: "❓ Insistir sobre el Mundo Oscuro sin abrir",
                action: () => window.interactuarPresoCelda()
            },
            {
                label: "🚫 Dejar encerrado y apartarse",
                action: () => {
                    cerrarDialogo();
                    if (img) img.src = state.encuentroCeldaActual.imgCelda;
                    document.getElementById("text-box").innerHTML =
                        `<b>Rincón de Rejas:</b> Decides no abrir la celda de ${state.encuentroCeldaActual.nombre}.`;
                }
            }
        ]);
    };

    window.seleccionarObjeto = function (index) {
        if (state.inventario[index]) {
            if (state.objetoSeleccionado === state.inventario[index].id) {
                state.objetoSeleccionado = null;
                document.getElementById(`slot-${index}`).classList.remove("selected");
                setCanvasCursor("cursor-default", canvas);
                document.getElementById("text-box").innerHTML = "Has guardado el objeto en la alforja.";
            } else {
                state.objetoSeleccionado = state.inventario[index].id;
                for (let i = 0; i < 3; i++) document.getElementById(`slot-${i}`).classList.remove("selected");
                document.getElementById(`slot-${index}`).classList.add("selected");
                setCanvasCursor(state.inventario[index].id === "llave" ? "cursor-key" : "cursor-default", canvas);
                document.getElementById("text-box").innerHTML = `Sostienes: <b>${state.inventario[index].nombre}</b>. Haz clic en el elemento del escenario donde quieras usarlo.`;
            }
        }
    };
}
