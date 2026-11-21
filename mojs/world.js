import { guardarEstadoMundoOscuro, sortearEncuentroCelda, state } from "./state.js";
import {
    construirLaberinto,
    construirRuinasExteriores,
    crearTexturaCielo,
    crearTexturaHierba,
    crearTexturaMadera,
    crearTexturaPiedra,
    limpiarFondoSprite
} from "./textures.js";
import {
    actualizarAudioInteriorCabana,
    actualizarHUDGrupo,
    actualizarInventario,
    cerrarDialogo,
    cerrarMenuNPC,
    ejecutarTraicionVillanoSiAplica,
    mostrarDialogoCompanero,
    mostrarGuiaAnciano,
    mostrarOpcionesLaberinto,
    prepararDiarioMision,
    prepararPergaminoAntiguo,
    registrarUIHandlers,
    reportMissionProgress,
    setCanvasCursor
} from "./ui.js";

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const nodes = [
    {
        id: "cabin",
        name: "La Cabaña de Piedra",
        position: new BABYLON.Vector3(0, 1.6, 0),
        target: new BABYLON.Vector3(0, 1.6, 10),
        desc: "El aire aquí sabe a ozono y ceniza fría. Entre ruinas inclinadas se alza la cabaña de piedra con su puerta de madera; algo metálico destella junto al muro.",
        connections: { right: "elder-enclave" }
    },
    {
        id: "cabin-interior",
        name: "El Interior de la Cabaña",
        position: new BABYLON.Vector3(-28, 1.6, 10),
        target: new BABYLON.Vector3(-28, 1.4, 17),
        desc: "El aire huele a humedad y cera quemada. Una vela ilumina un pergamino antiguo sobre la mesa de roble.",
        horrorInterior: true,
        connections: { left: "cabin" }
    },
    {
        id: "elder-enclave",
        name: "El Enclave del Anciano",
        position: new BABYLON.Vector3(15, 1.6, 10),
        target: new BABYLON.Vector3(15, 1.6, 20),
        desc: "Un monolito colosal y restos de pilares antiguos marcan este umbral extraño. El anciano místico aguarda a la izquierda del portón.",
        connections: { left: "cabin", right: "labyrinth-entrance" }
    },
    {
        id: "labyrinth-entrance",
        name: "La Entrada del Laberinto",
        position: new BABYLON.Vector3(15, 1.6, 31),
        target: new BABYLON.Vector3(15, 1.6, 41),
        desc: "Tras el portón, un corredor de piedra se hunde en la oscuridad. Unas huellas pequeñas avanzan hacia el interior.",
        connections: { left: "elder-enclave", right: "footprint-corridor" }
    },
    {
        id: "footprint-corridor",
        name: "La Bifurcación de las Huellas",
        position: new BABYLON.Vector3(15, 1.6, 42),
        target: new BABYLON.Vector3(15, 1.6, 52),
        desc: "Las huellas de la hija del rey se dividen en dos. A la izquierda, una cámara cubierta de polvo; a la derecha, el eco de un bramido.",
        connections: { left: "royal-clue", right: "minotaur-guard" }
    },
    {
        id: "royal-clue",
        name: "El Nicho de la Cinta Morada",
        position: new BABYLON.Vector3(7, 1.6, 52),
        target: new BABYLON.Vector3(2, 1.6, 52),
        desc: "Una cinta morada con el sello real está prendida entre las piedras. Las huellas de la princesa regresan hacia la galería del eco.",
        connections: { left: "footprint-corridor", right: "minotaur-guard" }
    },
    {
        id: "minotaur-guard",
        name: "La Guardia del Minotauro",
        position: new BABYLON.Vector3(23, 1.6, 52),
        target: new BABYLON.Vector3(33, 1.6, 52),
        desc: "Un minotauro armado patrulla la galería. Su mirada recorre el pasillo, atento a cualquier ruido.",
        connections: { left: "footprint-corridor", right: "echo-gallery" }
    },
    {
        id: "echo-gallery",
        name: "La Galería del Eco",
        position: new BABYLON.Vector3(35, 1.6, 52),
        target: new BABYLON.Vector3(43, 1.6, 52),
        desc: "Al otro lado de la guardia, las huellas siguen junto a marcas de una pequeña mano en el muro.",
        connections: { left: "minotaur-guard", right: "princess-sanctum" }
    },
    {
        id: "princess-sanctum",
        name: "El Rastro de la Princesa",
        position: new BABYLON.Vector3(43, 1.6, 52),
        target: new BABYLON.Vector3(43, 1.6, 62),
        desc: "Un broche real yace junto a una puerta entreabierta. La hija del rey ha pasado por aquí y se adentró en las ruinas.",
        connections: { left: "echo-gallery" }
    }
];

let camera;
let ambientLight, interiorLampLight, riftLight;
let minotaurSprite = null;
let animadoNPC;
let cintaRealRoot = null;
let cintaRealGlow = null;

function actualizarNavegacion(node) {
    document.getElementById("nav-left").hidden = !node.connections.left;
    document.getElementById("nav-right").hidden = !node.connections.right;
}

function aplicarAtmosferaNodo(esHorrorInterior, scene) {
    const viewport = document.getElementById("viewport");
    const banner = document.getElementById("location-banner");
    const staticLayer = document.getElementById("static-scene-layer");
    const staticImg = document.getElementById("static-scene-image");
    const noteSpot = document.getElementById("note-hotspot");
    const cellSpot = document.getElementById("cell-hotspot");
    const btn = document.querySelector(".hotspot-btn[onclick='cambiarAnguloInterior()']");

    if (esHorrorInterior) {
        if (!state.celdaLiberada) {
            sortearEncuentroCelda();
        }
        state.anguloInteriorAlternativo = false;
        staticImg.src = "img/moscuro/interior-cabana.jpg";
        staticImg.alt = "Interior oscuro de la cabaña medieval";
        if (noteSpot) noteSpot.classList.remove("is-hidden");
        if (cellSpot) cellSpot.classList.add("is-hidden");
        if (btn) btn.textContent = "🕯️ Mirar Rincón de Rejas";
        staticLayer.classList.add("is-active");
        staticLayer.setAttribute("aria-hidden", "false");
        scene.clearColor = new BABYLON.Color3(0.06, 0.06, 0.07);
        scene.fogDensity = 0.095;
        scene.fogColor = new BABYLON.Color3(0.08, 0.08, 0.09);
        ambientLight.intensity = 0.2;
        if (riftLight) riftLight.intensity = 0;
        interiorLampLight.intensity = 1.45;
        viewport.classList.add("horror-interior");
        banner.classList.add("horror-banner");
        actualizarAudioInteriorCabana(true);
    } else {
        staticLayer.classList.remove("is-active");
        staticLayer.setAttribute("aria-hidden", "true");
        if (noteSpot) noteSpot.classList.add("is-hidden");
        if (cellSpot) cellSpot.classList.add("is-hidden");
        scene.clearColor = new BABYLON.Color3(0.04, 0.04, 0.09);
        scene.fogDensity = 0.0065;
        scene.fogColor = new BABYLON.Color3(0.11, 0.1, 0.18);
        ambientLight.intensity = 0.88;
        if (riftLight) riftLight.intensity = 0.55;
        interiorLampLight.intensity = 0;
        viewport.classList.remove("horror-interior");
        banner.classList.remove("horror-banner");
        actualizarAudioInteriorCabana(false);
    }
}

function solicitarCombateMinotauro() {
    if (state.minotaurCombatRequested) return;
    state.minotaurCombatRequested = true;
    cerrarDialogo();
    document.getElementById("text-box").innerHTML +=
        "<p>El minotauro os ha descubierto. ¡Preparaos para combatir!</p>";

    if (window.parent === window) {
        state.minotaurCombatRequested = false;
        document.getElementById("text-box").innerHTML +=
            "<p>No se pudo iniciar el combate: abre esta aventura desde el juego principal.</p>";
        return;
    }

    const targetOrigin = window.location.origin === "null" ? "*" : window.location.origin;
    window.parent.postMessage({ type: "dark-world:start-minotaur-combat" }, targetOrigin);
}

function recogerCintaReal() {
    if (state.missionProgress.royalClueFound
        || nodes[state.currentNodeIndex].id !== "royal-clue") return;

    state.minotaurClueFound = true;
    state.missionProgress.royalClueFound = true;
    if (!state.inventario.some(item => item.id === "cinta-real")) {
        state.inventario.push({
            id: "cinta-real",
            nombre: "Cinta morada con el sello real",
            icono: "🎀"
        });
        actualizarInventario();
    }
    cintaRealRoot?.dispose();
    cintaRealRoot = null;
    cintaRealGlow?.dispose();
    cintaRealGlow = null;
    reportMissionProgress();

    document.getElementById("text-box").innerHTML =
        "<b>El Nicho de la Cinta Morada:</b> Has recogido la cinta con el sello real." +
        "<p>Grabado en la pared: «El bruto persigue ecos. La hija del rey hacía rodar una piedra por la galería contraria y cruzaba pegada al muro».</p>";
    mostrarDialogoCompanero("La cinta es de la princesa. Y la inscripción nos da una forma de distraer al minotauro.");
}

function resolverEntradaNodo(node) {
    const textBox = document.getElementById("text-box");
    if (node.id === "cabin-interior") {
        textBox.innerHTML +=
            "<p>Pasa el cursor por el pergamino sobre la mesa para leerlo, mira hacia el rincón de rejas o sal al exterior.</p>";
    }

    if (node.id === "labyrinth-entrance") {
        mostrarGuiaAnciano(
            "«El laberinto pone a prueba tanto el pulso como la escucha. Seguid las huellas, pero no confiéis en todo eco que os llame.»"
        );
    }

    if (node.id === "footprint-corridor") {
        mostrarGuiaAnciano(
            "«A la izquierda aguarda un indicio de la princesa; a la derecha, una bestia de paso pesado. Elegid con astucia antes de avanzar.»"
        );
    }

    if (node.id === "royal-clue") {
        if (state.missionProgress.royalClueFound) {
            textBox.innerHTML +=
                "<p>El hueco conserva la marca de la cinta morada que ya recogiste. La inscripción explica cómo engañar al guardián.</p>";
        } else {
            textBox.innerHTML +=
                "<p>Una cinta morada con el sello real está prendida entre las piedras. Haz clic sobre ella para recogerla.</p>";
        }
    }

    if (node.id === "minotaur-guard") {
        if (state.traicionPendiente && !state.traicionEjecutada) {
            ejecutarTraicionVillanoSiAplica(
                `Justo frente a la guardia del minotauro, ${state.encuentroCeldaActual.nombre} te golpea por la espalda y se escabulle.`,
                canvas
            );
        }

        if (state.minotaurDefeated) {
            textBox.innerHTML += "<p>El guardián yace vencido; el camino está despejado.</p>";
            return;
        }
        if (state.minotaurDistracted) {
            textBox.innerHTML += "<p>El minotauro sigue buscando el ruido en el otro corredor. Avanzad en silencio.</p>";
            return;
        }
        mostrarOpcionesLaberinto([
            {
                label: "Hacer rodar una piedra por el corredor opuesto y avanzar pegados al muro",
                action: () => {
                    if (!state.minotaurClueFound) {
                        solicitarCombateMinotauro();
                        return;
                    }
                    state.minotaurDistracted = true;
                    if (minotaurSprite) minotaurSprite.isVisible = false;
                    state.missionProgress.guardianPassed = true;
                    reportMissionProgress();
                    textBox.innerHTML =
                        "<b>La Guardia del Minotauro:</b> El eco atrae al guardián hacia el pasillo falso. Pasáis sin que os vea.";
                    mostrarDialogoCompanero("¡Buen plan! La princesa dejó el camino preparado para quien supiera leer sus señales.");
                }
            },
            {
                label: "Echar a correr por el centro del corredor",
                action: solicitarCombateMinotauro
            }
        ]);
    }

    if (node.id === "princess-sanctum") {
        if (state.traicionPendiente && !state.traicionEjecutada) {
            ejecutarTraicionVillanoSiAplica(
                `Al llegar al santuario, ${state.encuentroCeldaActual.nombre} te traiciona y huye con parte de tu carga.`,
                canvas
            );
        }
        state.minotaurClueFound = true;
        state.missionProgress.princessTrailFound = true;
        reportMissionProgress();
        if (!state.inventario.some(item => item.id === "broche-real")) {
            state.inventario.push({ id: "broche-real", nombre: "Broche de la hija del rey", icono: "👑" });
            actualizarInventario();
        }
        textBox.innerHTML +=
            "<p>El broche confirma que la hija del rey cruzó el laberinto. Sus huellas continúan hacia las ruinas.</p>";
    }
}

export function createWorldScene() {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.04, 0.04, 0.09);
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.0065;
    scene.fogColor = new BABYLON.Color3(0.11, 0.1, 0.18);

    const skybox = BABYLON.MeshBuilder.CreateSphere(
        "darkWorldSky",
        { diameter: 700, segments: 24, sideOrientation: BABYLON.Mesh.BACKSIDE },
        scene
    );
    skybox.infiniteDistance = true;
    skybox.isPickable = false;
    const skyMaterial = new BABYLON.StandardMaterial("darkWorldSkyMaterial", scene);
    skyMaterial.backFaceCulling = false;
    skyMaterial.disableLighting = true;
    skyMaterial.disableDepthWrite = true;
    skyMaterial.fogEnabled = false;
    skyMaterial.emissiveTexture = crearTexturaCielo(scene);
    skybox.material = skyMaterial;

    ambientLight = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.88;
    ambientLight.diffuse = new BABYLON.Color3(0.7, 0.72, 0.96);
    ambientLight.groundColor = new BABYLON.Color3(0.12, 0.11, 0.18);

    riftLight = new BABYLON.PointLight("riftLight", new BABYLON.Vector3(12, 4.5, 22), scene);
    riftLight.diffuse = new BABYLON.Color3(0.68, 0.45, 0.92);
    riftLight.intensity = 0.55;
    riftLight.range = 28;

    interiorLampLight = new BABYLON.PointLight("interiorLampLight", new BABYLON.Vector3(-28, 1.8, 12), scene);
    interiorLampLight.diffuse = new BABYLON.Color3(0.95, 0.82, 0.68);
    interiorLampLight.range = 12;
    interiorLampLight.intensity = 0;

    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 80, height: 140 }, scene);
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseTexture = crearTexturaHierba(scene);
    groundMat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.07);
    ground.material = groundMat;

    const matPiedra = new BABYLON.StandardMaterial("matPiedra", scene);
    matPiedra.diffuseTexture = crearTexturaPiedra(scene);
    matPiedra.specularColor = new BABYLON.Color3(0.12, 0.14, 0.17);
    construirLaberinto(scene, matPiedra);
    construirRuinasExteriores(scene, matPiedra);

    const matMadera = crearTexturaMadera(scene);

    const cabana = BABYLON.MeshBuilder.CreateBox("cabana", { width: 5, height: 4, depth: 6 }, scene);
    cabana.position = new BABYLON.Vector3(-3.5, 2, 10);
    cabana.material = matPiedra;

    const meshPuertaCabana = BABYLON.MeshBuilder.CreateBox("puertaCabana", { width: 1.2, height: 2.2, depth: 0.18 }, scene);
    meshPuertaCabana.position = new BABYLON.Vector3(-1.0, 1.1, 8.2);
    meshPuertaCabana.rotation.y = Math.PI / 2;
    const matPuertaCabana = new BABYLON.StandardMaterial("matPuertaCabana", scene);
    matPuertaCabana.diffuseTexture = matMadera;
    meshPuertaCabana.material = matPuertaCabana;

    meshPuertaCabana.actionManager = new BABYLON.ActionManager(scene);
    meshPuertaCabana.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function () {
            if (nodes[state.currentNodeIndex].id === "cabin") {
                window.irANodoPorId("cabin-interior");
            }
        })
    );

    const keyRoot = new BABYLON.TransformNode("llave-antigua", scene);
    keyRoot.position = new BABYLON.Vector3(-0.8, 0.075, 6.5);
    const keyParts = [];
    const matLlave = new BABYLON.StandardMaterial("matLlave", scene);
    matLlave.diffuseColor = new BABYLON.Color3(0.62, 0.39, 0.12);
    matLlave.specularColor = new BABYLON.Color3(0.9, 0.72, 0.36);
    matLlave.emissiveColor = new BABYLON.Color3(0.08, 0.045, 0.008);

    const meshLlave = BABYLON.MeshBuilder.CreateBox(
        "llave",
        { width: 0.56, height: 0.055, depth: 0.09 },
        scene
    );
    meshLlave.parent = keyRoot;
    meshLlave.position.x = 0.1;
    meshLlave.material = matLlave;
    keyParts.push(meshLlave);

    const keyRing = BABYLON.MeshBuilder.CreateTorus(
        "llave-anilla",
        { diameter: 0.38, thickness: 0.055, tessellation: 28 },
        scene
    );
    keyRing.parent = keyRoot;
    keyRing.position.x = -0.22;
    keyRing.rotation.x = Math.PI / 2;
    keyRing.material = matLlave;
    keyParts.push(keyRing);

    for (const toothX of [0.26, 0.4]) {
        const tooth = BABYLON.MeshBuilder.CreateBox(
            "llave-diente",
            { width: 0.07, height: 0.055, depth: 0.13 },
            scene
        );
        tooth.parent = keyRoot;
        tooth.position.set(toothX, 0, -0.055);
        tooth.material = matLlave;
        keyParts.push(tooth);
    }

    const keyLight = new BABYLON.PointLight(
        "keyLight",
        new BABYLON.Vector3(-0.8, 1.1, 6.5),
        scene
    );
    keyLight.diffuse = new BABYLON.Color3(0.92, 0.67, 0.3);
    keyLight.intensity = 0.35;
    keyLight.range = 7;
    if (state.llaveCogida) {
        keyRoot.dispose();
        keyLight.dispose();
    }

    const recogerLlave = () => {
        if (!state.llaveCogida) {
            state.llaveCogida = true;
            state.inventario.push({ id: "llave", nombre: "Llave de Hierro Antiguo", icono: "🗝️" });
            keyRoot.dispose();
            keyLight.dispose();
            setCanvasCursor("cursor-default", canvas);
            actualizarInventario();
            document.getElementById("text-box").innerHTML = "Has recogido una pesada <b>Llave de Hierro Antiguo</b>.";

            setTimeout(() => {
                mostrarDialogoCompanero("¡Perfecto! Guarda eso bien. Apostaría a que abre la puerta del monolito al otro lado.");
            }, 500);
            guardarEstadoMundoOscuro();
        }
    };
    keyParts.forEach(part => {
        part.metadata = { isAncientKey: true };
        part.actionManager = new BABYLON.ActionManager(scene);
        part.actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, recogerLlave)
        );
    });

    const monolito = BABYLON.MeshBuilder.CreateCylinder("monolito", { height: 9, diameterTop: 3.5, diameterBottom: 4.5 }, scene);
    monolito.position = new BABYLON.Vector3(15, 4.5, 25);
    monolito.material = matPiedra;

    const meshPuerta = BABYLON.MeshBuilder.CreateBox("puerta", { width: 1.6, height: 2.6, depth: 0.25 }, scene);
    meshPuerta.position = new BABYLON.Vector3(15, 1.3, 22.8);
    const matPuerta = new BABYLON.StandardMaterial("matPuerta", scene);
    matPuerta.diffuseTexture = matMadera;
    meshPuerta.material = matPuerta;
    if (state.puertaAbierta) {
        meshPuerta.rotation.y = Math.PI / 2.2;
        meshPuerta.position.x -= 0.7;
        meshPuerta.position.z -= 0.6;
    }

    meshPuerta.actionManager = new BABYLON.ActionManager(scene);
    meshPuerta.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function () {
        if (state.puertaAbierta) return;

        if (state.objetoSeleccionado === "llave") {
            state.puertaAbierta = true;
            meshPuerta.rotation.y = Math.PI / 2.2;
            meshPuerta.position.x -= 0.7;
            meshPuerta.position.z -= 0.6;
            state.objetoSeleccionado = null;
            document.getElementById("slot-0").classList.remove("selected");
            setCanvasCursor("cursor-default", canvas);
            document.getElementById("text-box").innerHTML = "¡La llave abre el portón del monolito!";

            setTimeout(() => {
                mostrarDialogoCompanero("Las runas de la puerta se han apagado. El camino está abierto.");
            }, 600);
            guardarEstadoMundoOscuro();
        } else {
            document.getElementById("text-box").innerHTML = "El portón de roble está cerrado herméticamente.";
            mostrarDialogoCompanero("Necesitamos encontrar una llave o un mecanismo para abrir este portón.");
        }
    }));

    if (!state.missionProgress.royalClueFound) {
        cintaRealRoot = new BABYLON.TransformNode("cinta-real-root", scene);
        cintaRealRoot.position = new BABYLON.Vector3(0.62, 1.15, 52);

        const materialCinta = new BABYLON.StandardMaterial("materialCintaMorada", scene);
        materialCinta.diffuseColor = new BABYLON.Color3(0.55, 0.25, 0.78);
        materialCinta.emissiveColor = new BABYLON.Color3(0.12, 0.035, 0.2);
        materialCinta.specularColor = new BABYLON.Color3(0.18, 0.12, 0.24);

        const partesCinta = [];
        for (const z of [-0.13, 0.13]) {
            const lazo = BABYLON.MeshBuilder.CreateTorus(
                "cinta-lazo",
                { diameter: 0.34, thickness: 0.055, tessellation: 24 },
                scene
            );
            lazo.parent = cintaRealRoot;
            lazo.position.z = z;
            lazo.rotation.y = Math.PI / 2;
            lazo.scaling.set(0.85, 0.7, 1);
            lazo.material = materialCinta;
            partesCinta.push(lazo);
        }

        const meshCintaReal = BABYLON.MeshBuilder.CreateBox(
            "cinta-real",
            { width: 0.055, height: 0.14, depth: 0.17 },
            scene
        );
        meshCintaReal.parent = cintaRealRoot;
        meshCintaReal.material = materialCinta;
        partesCinta.push(meshCintaReal);

        for (const z of [-0.075, 0.075]) {
            const cola = BABYLON.MeshBuilder.CreateBox(
                "cinta-cola",
                { width: 0.045, height: 0.3, depth: 0.11 },
                scene
            );
            cola.parent = cintaRealRoot;
            cola.position.set(0, -0.2, z);
            cola.rotation.x = z < 0 ? 0.12 : -0.12;
            cola.material = materialCinta;
            partesCinta.push(cola);
        }

        const materialSello = new BABYLON.StandardMaterial("materialSelloReal", scene);
        materialSello.diffuseColor = new BABYLON.Color3(0.88, 0.68, 0.28);
        materialSello.emissiveColor = new BABYLON.Color3(0.12, 0.07, 0.015);
        const sello = BABYLON.MeshBuilder.CreateSphere(
            "sello-real-cinta",
            { diameter: 0.085, segments: 12 },
            scene
        );
        sello.parent = cintaRealRoot;
        sello.position.x = 0.04;
        sello.material = materialSello;
        partesCinta.push(sello);

        partesCinta.forEach(parte => {
            parte.metadata = { isRoyalRibbon: true };
            parte.actionManager = new BABYLON.ActionManager(scene);
            parte.actionManager.registerAction(
                new BABYLON.ExecuteCodeAction(
                    BABYLON.ActionManager.OnPickTrigger,
                    recogerCintaReal
                )
            );
        });

        cintaRealGlow = new BABYLON.PointLight(
            "brilloCintaMorada",
            new BABYLON.Vector3(1.05, 1.45, 52),
            scene
        );
        cintaRealGlow.diffuse = new BABYLON.Color3(0.62, 0.3, 0.95);
        cintaRealGlow.intensity = 0.3;
        cintaRealGlow.range = 3.5;
    }

    const minotaurManager = new BABYLON.SpriteManager(
        "minotaurManager",
        "img/moscuro/minotauro_idle.png",
        1,
        { width: 264, height: 472 },
        scene
    );
    minotaurSprite = new BABYLON.Sprite("minotaurGuard", minotaurManager);
    minotaurSprite.position = new BABYLON.Vector3(32, 2.4, 52);
    minotaurSprite.size = 4.5;
    minotaurSprite.playAnimation(0, 17, true, 110);

    limpiarFondoSprite("img/moscuro/anciano.png", function (imagenLimpiaBase64, cellW, cellH) {
        const spriteManagerAnim = new BABYLON.SpriteManager("spriteAnim", imagenLimpiaBase64, 1, { width: cellW, height: cellH }, scene);
        spriteManagerAnim.isPickable = true;

        animadoNPC = new BABYLON.Sprite("npcAnimado", spriteManagerAnim);
        animadoNPC.position = new BABYLON.Vector3(11.2, 1.5, 20.5);
        animadoNPC.size = 3.2;
        animadoNPC.isPickable = true;
        animadoNPC.playAnimation(0, 3, true, 850);
    });

    scene.onPointerMove = function () {
        const pickSprite = scene.pickSprite(scene.pointerX, scene.pointerY);
        if (pickSprite && pickSprite.hit && pickSprite.pickedSprite === animadoNPC && nodes[state.currentNodeIndex].id === "elder-enclave") {
            setCanvasCursor("cursor-talk", canvas);
            return;
        }

        const pickMesh = scene.pick(scene.pointerX, scene.pointerY);
        if (pickMesh && pickMesh.hit && pickMesh.pickedMesh) {
            const nombre = pickMesh.pickedMesh.name;
            if (nombre === "llave" || pickMesh.pickedMesh.metadata?.isAncientKey) {
                setCanvasCursor("cursor-examine", canvas);
                return;
            }
            if (pickMesh.pickedMesh.metadata?.isRoyalRibbon) {
                setCanvasCursor("cursor-examine", canvas);
                return;
            }
            if (nombre === "puertaCabana") {
                setCanvasCursor("cursor-hand", canvas);
                return;
            }
            if (nombre === "puerta") {
                setCanvasCursor(state.objetoSeleccionado === "llave" ? "cursor-key" : "cursor-hand", canvas);
                return;
            }
        }

        setCanvasCursor(state.objetoSeleccionado === "llave" ? "cursor-key" : "cursor-default", canvas);
    };

    scene.onPointerDown = function () {
        if (nodes[state.currentNodeIndex].horrorInterior) {
            actualizarAudioInteriorCabana(true);
        }
        const pickSprite = scene.pickSprite(scene.pointerX, scene.pointerY);
        if (pickSprite && pickSprite.hit && pickSprite.pickedSprite === animadoNPC) {
            if (nodes[state.currentNodeIndex].id === "elder-enclave") {
                document.getElementById("npc-menu").style.display = "flex";
            }
        }
    };

    scene.registerBeforeRender(function () {
        const t = performance.now() * 0.0025;
        if (riftLight && !nodes[state.currentNodeIndex].horrorInterior) {
            riftLight.intensity = 0.52 + Math.sin(t) * 0.14;
        }
        if (nodes[state.currentNodeIndex].horrorInterior && interiorLampLight) {
            interiorLampLight.position.copyFrom(camera.position);
            interiorLampLight.intensity = 1.45 + Math.sin(performance.now() * 0.016) * 0.16;
        }
    });

    camera = new BABYLON.UniversalCamera("Cam", nodes[0].position, scene);
    const initialTarget = nodes[0].target.clone();
    initialTarget.y -= 0.75;
    camera.setTarget(initialTarget);
    camera.angularSensibility = 1500;

    return scene;
}

export function initWorld() {
    const scene = createWorldScene();
    registrarUIHandlers(canvas);

    window.irANodoPorId = function (targetId) {
        const nextIndex = nodes.findIndex(node => node.id === targetId);
        if (nextIndex === -1) return;

        state.currentNodeIndex = nextIndex;
        const targetNode = nodes[state.currentNodeIndex];
        aplicarAtmosferaNodo(Boolean(targetNode.horrorInterior), scene);

        const startPosition = camera.position.clone();
        const startRotation = camera.rotation.clone();
        camera.position.copyFrom(targetNode.position);
        const cameraTarget = targetNode.target.clone();
        cameraTarget.y -= 0.75;
        camera.setTarget(cameraTarget);
        const targetRotation = camera.rotation.clone();
        camera.position.copyFrom(startPosition);
        camera.rotation.copyFrom(startRotation);

        BABYLON.Animation.CreateAndStartAnimation(
            "camMove", camera, "position", 30, 25,
            camera.position, targetNode.position,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        BABYLON.Animation.CreateAndStartAnimation(
            "camTurn", camera, "rotation", 30, 25,
            startRotation, targetRotation,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        document.getElementById("location-banner").innerText = targetNode.name;
        document.getElementById("text-box").innerHTML = `<b>${targetNode.name}:</b> ${targetNode.desc}`;
        actualizarNavegacion(targetNode);
        cerrarMenuNPC();
        cerrarDialogo();
        resolverEntradaNodo(targetNode);
        guardarEstadoMundoOscuro();

        if (targetNode.id === "elder-enclave") {
            setTimeout(() => {
                if (nodes[state.currentNodeIndex].id === "elder-enclave") {
                    mostrarDialogoCompanero("Mirad... hay un anciano a la izquierda del monolito. Quizás sabe algo; vamos a hablar con él.");
                }
            }, 800);
        } else if (targetNode.id === "cabin-interior") {
            setTimeout(() => {
                if (nodes[state.currentNodeIndex].id === "cabin-interior") {
                    mostrarDialogoCompanero("Aquí dentro hace un frío extraño... Mira esa nota sobre la mesa.");
                }
            }, 700);
        }
    };

    window.cambiarNodo = function (direction) {
        const currentNode = nodes[state.currentNodeIndex];
        const directionName = direction < 0 ? "left" : "right";
        const targetId = currentNode.connections[directionName];
        if (!targetId) return;

        if (targetId === "labyrinth-entrance" && !state.puertaAbierta) {
            document.getElementById("text-box").innerHTML =
                "El portón del monolito sigue cerrado. Necesitas la llave de hierro.";
            return;
        }

        if (currentNode.id === "minotaur-guard" && directionName === "right"
            && !state.minotaurDistracted && !state.minotaurDefeated) {
            document.getElementById("text-box").innerHTML =
                "El minotauro bloquea la galería. Engáñalo o enfréntate a él antes de continuar.";
            return;
        }

        window.irANodoPorId(targetId);
    };

    window.addEventListener("message", event => {
        if (event.origin !== window.location.origin || event.source !== window.parent) return;
        if (event.data?.type !== "dark-world:minotaur-defeated") return;

        state.minotaurDefeated = true;
        state.minotaurDistracted = true;
        state.minotaurCombatRequested = false;
        state.missionProgress.guardianPassed = true;
        state.missionProgress.guardianDefeated = true;
        reportMissionProgress();
        if (minotaurSprite) {
            minotaurSprite.dispose();
            minotaurSprite = null;
        }
        if (nodes[state.currentNodeIndex].id === "minotaur-guard") {
            document.getElementById("text-box").innerHTML =
                "<b>La Guardia del Minotauro:</b> El guardián ha caído. La galería queda libre.";
            actualizarNavegacion(nodes[state.currentNodeIndex]);
            mostrarDialogoCompanero("Habéis vencido al guardián. Las huellas de la princesa siguen al otro lado.");
        }
    });

    if (state.missionProgress.royalClueFound) {
        if (!state.inventario.some(item => item.id === "cinta-real")) {
            state.inventario.push({
                id: "cinta-real",
                nombre: "Cinta morada con el sello real",
                icono: "🎀"
            });
        }
        actualizarInventario();
    }
    if (state.minotaurDefeated && minotaurSprite) {
        minotaurSprite.dispose();
        minotaurSprite = null;
    } else if (state.minotaurDistracted && minotaurSprite) {
        minotaurSprite.isVisible = false;
    }

    actualizarHUDGrupo();
    prepararDiarioMision();
    prepararPergaminoAntiguo();
    reportMissionProgress();
    actualizarNavegacion(nodes[state.currentNodeIndex]);
    aplicarAtmosferaNodo(Boolean(nodes[state.currentNodeIndex].horrorInterior), scene);
    if (state.currentNodeIndex > 0) {
        window.irANodoPorId(nodes[state.currentNodeIndex].id);
    }
    guardarEstadoMundoOscuro();
    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
}