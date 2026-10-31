// js/systems/jefes.js
// Qué jefe toca en cada planta y cómo se convierte en un enemigo de combate. Lógica pura, sin DOM.

import { BOSSES } from '../data/Bosses.js';
import { BOSS } from '../data/gameConfig.js';

/** ¿Hay jefe en esta planta? (5, 10, 15...) */
export const isBossFloor = (floor) => floor > 0 && floor % BOSS.EVERY === 0;

/** Jefe de la planta, o null si no toca. Al acabar la lista vuelve a empezar. */
export function getBossForFloor(floor) {
    if (!isBossFloor(floor)) return null;
    return BOSSES[(floor / BOSS.EVERY - 1) % BOSSES.length];
}

/** Datos de combate del jefe en esa planta (vida y ataque crecen con la planta). */
export function buildBossEnemy(boss, floor) {
    const hp = Math.round(boss.baseHp + boss.hpPerFloor * floor);

    return {
        name: boss.name,
        hp,
        maxHp: hp,
        atk: Math.round(boss.baseAtk + boss.atkPerFloor * floor),
        img: boss.img,
        deckId: boss.deckId,
        speaker: boss,
        isBoss: true,
        armor: boss.armor,
        phases: boss.phases.map(phase => ({ ...phase }))
    };
}