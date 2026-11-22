export function limpiarFondoSprite(urlImagen, callback) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = function () {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const ctx = tempCanvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
            const esGrisFondo = maxDiff < 12 && r > 40 && r < 220;
            const esLineaNegra = r < 25 && g < 25 && b < 25;

            if (esGrisFondo || esLineaNegra) {
                data[i + 3] = 0;
            }
        }

        ctx.putImageData(imgData, 0, 0);
        const columns = 6;
        const rows = 3;
        callback(
            tempCanvas.toDataURL("image/png"),
            Math.floor(img.width / columns),
            Math.floor(img.height / rows)
        );
    };
    img.src = urlImagen;
}

export function crearTexturaPiedra(scene) {
    const tex = new BABYLON.DynamicTexture("piedraTex", 512, scene, false);
    const ctx = tex.getContext();
    let seed = 8147;
    const aleatorio = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
    };

    ctx.fillStyle = "#171b20";
    ctx.fillRect(0, 0, 512, 512);
    for (let row = 0; row < 8; row++) {
        const y = row * 64;
        const offset = row % 2 === 0 ? 0 : -64;
        for (let x = offset; x < 512; x += 128) {
            const tone = 67 + Math.floor(aleatorio() * 28);
            ctx.fillStyle = `rgb(${tone}, ${tone + 3}, ${tone + 8})`;
            ctx.fillRect(x + 3, y + 3, 122, 58);
            ctx.fillStyle = "rgba(211, 222, 230, 0.12)";
            ctx.fillRect(x + 5, y + 5, 118, 2);
            ctx.fillStyle = "rgba(4, 7, 10, 0.32)";
            ctx.fillRect(x + 5, y + 58, 118, 2);

            for (let fleck = 0; fleck < 18; fleck++) {
                const shade = aleatorio() > 0.5 ? 255 : 0;
                ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${0.025 + aleatorio() * 0.07})`;
                ctx.fillRect(
                    x + 5 + aleatorio() * 116,
                    y + 7 + aleatorio() * 48,
                    2 + aleatorio() * 8,
                    1 + aleatorio() * 3
                );
            }
        }
    }

    tex.update();
    tex.uScale = 2.5;
    tex.vScale = 2.5;
    tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
    tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
    return tex;
}

export function crearTexturaCielo(scene) {
    const tex = new BABYLON.DynamicTexture("cieloOscuroTex", { width: 1024, height: 512 }, scene, false);
    const ctx = tex.getContext();
    let seed = 1279;
    const aleatorio = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
    };
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, "#050712");
    gradient.addColorStop(0.45, "#15122b");
    gradient.addColorStop(0.78, "#28223d");
    gradient.addColorStop(1, "#4a3846");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 512);

    const riftGlow = ctx.createRadialGradient(540, 415, 6, 540, 415, 340);
    riftGlow.addColorStop(0, "rgba(186, 128, 214, 0.42)");
    riftGlow.addColorStop(0.35, "rgba(116, 78, 152, 0.22)");
    riftGlow.addColorStop(0.7, "rgba(64, 56, 98, 0.1)");
    riftGlow.addColorStop(1, "rgba(16, 22, 38, 0)");
    ctx.fillStyle = riftGlow;
    ctx.fillRect(140, 120, 800, 392);

    for (let band = 0; band < 18; band++) {
        const bx = aleatorio() * 1024;
        const by = 180 + aleatorio() * 210;
        const bw = 90 + aleatorio() * 220;
        const bh = 10 + aleatorio() * 26;
        ctx.fillStyle = band % 2 === 0
            ? `rgba(88, 72, 118, ${0.06 + aleatorio() * 0.08})`
            : `rgba(24, 29, 46, ${0.12 + aleatorio() * 0.12})`;
        ctx.beginPath();
        ctx.ellipse(bx, by, bw, bh, (aleatorio() - 0.5) * 0.18, 0, Math.PI * 2);
        ctx.fill();
    }

    for (let star = 0; star < 480; star++) {
        const x = aleatorio() * 1024;
        const y = aleatorio() * 350;
        const radius = 0.25 + aleatorio() * 0.7;
        const alpha = 0.25 + aleatorio() * 0.7;
        ctx.fillStyle = star % 9 === 0
            ? `rgba(214, 178, 255, ${alpha})`
            : `rgba(222, 230, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    tex.update();
    tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
    tex.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
    return tex;
}

export function crearTexturaHierba(scene) {
    const tex = new BABYLON.DynamicTexture("hierbaTex", 1024, scene, false);
    const ctx = tex.getContext();
    let seed = 3907;
    const aleatorio = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
    };
    ctx.fillStyle = "#222929";
    ctx.fillRect(0, 0, 1024, 1024);

    for (let patch = 0; patch < 2800; patch++) {
        const roll = aleatorio();
        ctx.fillStyle = roll > 0.62
            ? `rgba(74, 88, 66, ${0.04 + aleatorio() * 0.1})`
            : roll > 0.3
                ? `rgba(54, 48, 72, ${0.03 + aleatorio() * 0.08})`
                : `rgba(7, 12, 16, ${0.04 + aleatorio() * 0.12})`;
        ctx.beginPath();
        ctx.ellipse(
            aleatorio() * 1024,
            aleatorio() * 1024,
            2 + aleatorio() * 22,
            2 + aleatorio() * 12,
            aleatorio() * Math.PI,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    for (let blade = 0; blade < 6500; blade++) {
        const x = aleatorio() * 1024;
        const y = aleatorio() * 1024;
        ctx.strokeStyle = aleatorio() > 0.55
            ? "rgba(116, 126, 98, 0.18)"
            : "rgba(5, 10, 14, 0.24)";
        ctx.lineWidth = 0.7 + aleatorio();
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + aleatorio() * 4 - 2, y - 2 - aleatorio() * 6);
        ctx.stroke();
    }

    tex.update();
    tex.uScale = 24;
    tex.vScale = 36;
    tex.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
    tex.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
    return tex;
}

export function crearTexturaMadera(scene) {
    const tex = new BABYLON.DynamicTexture("maderaTex", 512, scene, false);
    const ctx = tex.getContext();
    let seed = 719;
    const aleatorio = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
    };
    ctx.fillStyle = "#241912";
    ctx.fillRect(0, 0, 512, 512);
    for (let plank = 0; plank < 4; plank++) {
        const x = plank * 128;
        const tone = 54 + Math.floor(aleatorio() * 25);
        ctx.fillStyle = `rgb(${tone}, ${Math.floor(tone * 0.67)}, ${Math.floor(tone * 0.42)})`;
        ctx.fillRect(x + 3, 0, 122, 512);
        ctx.fillStyle = "rgba(8, 5, 3, 0.55)";
        ctx.fillRect(x, 0, 3, 512);
        for (let grain = 0; grain < 24; grain++) {
            const gx = x + 8 + aleatorio() * 108;
            ctx.strokeStyle = `rgba(14, 8, 4, ${0.12 + aleatorio() * 0.2})`;
            ctx.lineWidth = 1 + aleatorio() * 2;
            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.bezierCurveTo(
                gx + aleatorio() * 8 - 4, 170,
                gx + aleatorio() * 8 - 4, 340,
                gx + aleatorio() * 8 - 4, 512
            );
            ctx.stroke();
        }
    }
    tex.update();
    return tex;
}

export function construirRuinasExteriores(scene, matPiedra) {
    const matRuina = new BABYLON.StandardMaterial("matRuinaExtraña", scene);
    matRuina.diffuseTexture = matPiedra.diffuseTexture;
    matRuina.diffuseColor = new BABYLON.Color3(0.76, 0.72, 0.86);
    matRuina.specularColor = new BABYLON.Color3(0.14, 0.13, 0.18);

    const columnas = [
        [-6.8, 1.8, 4.2, 0.85, 3.6, 0.08, -0.14],
        [-5.6, 1.1, 14.8, 0.75, 2.2, -0.18, 0.22],
        [4.8, 2.1, 14.5, 0.9, 4.2, 0.05, 0.11],
        [9.5, 1.5, 6.2, 0.8, 3.0, -0.09, -0.06],
        [21.5, 2.3, 15.2, 0.95, 4.6, 0.07, -0.12],
        [24.2, 1.2, 23.8, 0.85, 2.4, 0.24, 0.15]
    ];
    columnas.forEach(([x, y, z, diam, h, rx, rz], idx) => {
        const col = BABYLON.MeshBuilder.CreateCylinder(
            `ruina-columna-${idx}`,
            { height: h, diameterTop: diam * 0.86, diameterBottom: diam, tessellation: 10 },
            scene
        );
        col.position.set(x, y, z);
        col.rotation.set(rx, idx * 0.7, rz);
        col.material = matRuina;
        col.isPickable = false;
    });

    const bloques = [
        [-4.5, 0.35, 5.2, 1.6, 0.7, 1.2, 0.2],
        [2.4, 0.25, 13.0, 1.9, 0.5, 1.3, -0.35],
        [12.5, 0.3, 15.8, 1.5, 0.6, 1.1, 0.45],
        [18.2, 0.22, 18.5, 2.1, 0.45, 1.4, -0.15]
    ];
    bloques.forEach(([x, y, z, w, h, d, ry], idx) => {
        const block = BABYLON.MeshBuilder.CreateBox(
            `ruina-bloque-${idx}`,
            { width: w, height: h, depth: d },
            scene
        );
        block.position.set(x, y, z);
        block.rotation.y = ry;
        block.material = matRuina;
        block.isPickable = false;
    });

    const arcoIzq = BABYLON.MeshBuilder.CreateBox("ruina-arco-izq", { width: 0.75, height: 3.4, depth: 0.75 }, scene);
    arcoIzq.position.set(7.6, 1.7, 17.5);
    arcoIzq.rotation.z = 0.08;
    arcoIzq.material = matRuina;
    arcoIzq.isPickable = false;

    const arcoDintel = BABYLON.MeshBuilder.CreateBox("ruina-arco-dintel", { width: 2.6, height: 0.55, depth: 0.8 }, scene);
    arcoDintel.position.set(8.6, 3.45, 17.5);
    arcoDintel.rotation.z = -0.14;
    arcoDintel.material = matRuina;
    arcoDintel.isPickable = false;
}

function crearParedLaberinto(scene, material, x, z, width, depth) {
    const wall = BABYLON.MeshBuilder.CreateBox(
        `maze-wall-${x}-${z}-${width}-${depth}`,
        { width, height: 4, depth },
        scene
    );
    wall.position.set(x, 2, z);
    wall.material = material;
}

export function construirLaberinto(scene, material) {
    [
        [25, 38, 50, 1], [25, 65, 50, 1],
        [0, 51, 1, 28], [50, 51, 1, 28],
        [14, 43, 1, 10], [14, 59, 1, 10],
        [26, 43, 1, 10], [26, 59, 1, 10],
        [38, 43, 1, 10], [38, 59, 1, 10],
        [7, 48, 10, 1], [20, 48, 10, 1],
        [7, 54, 10, 1], [20, 54, 10, 1]
    ].forEach(([x, z, width, depth]) => {
        crearParedLaberinto(scene, material, x, z, width, depth);
    });
}