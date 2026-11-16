// js/systems/Party.js

import { ALLIES } from '../data/allyCatalog.js';
import { ALLY_PROGRESSION, PARTY } from '../data/gameConfig.js';

/**
 * Convierte la habilidad del aliado
 * en una carta utilizable durante combate.
 */
export function buildAllyCard(ally, level) {

    const { ability } = ally;

    return {
        id: `ally_${ally.id}`,
        name: `${ability.name} (${ally.name})`,
        cost: 0,
        type: ability.type,
        val: ability.base + (ability.perLevel * level),
        turns: ability.turns
    };

}

export class Party {

    constructor(game, catalog = ALLIES) {

        this.game = game;

        this.catalog = catalog;

        // Todos los personajes reclutados
        this.recruited = [];

        // Personajes activos para combate
        this.active = [];

    }

    // -------------------------
    // CONSULTAS
    // -------------------------

    has(id) {

        return this.recruited.some(
            ally => ally.id === id
        );

    }

    hasActive(id) {

        return this.active.some(
            ally => ally.id === id
        );

    }

    getRecruitCount() {

        return this.recruited.length;

    }

    isRecruitmentFull() {

        return this.recruited.length >= PARTY.MAX;

    }

    getActiveCount() {

        return this.active.length;

    }

    /**
     * Límite dinámico de personajes activos.
     */
    getMaxActiveMembers() {

        const level =
            this.game?.player?.level ?? 1;

        if (level >= 11) return 4;

        if (level >= 8) return 3;

        if (level >= 3) return 2;

        return 1;

    }

    isActivePartyFull() {

        return (
            this.active.length >=
            this.getMaxActiveMembers()
        );

    }

    getPartyInfo() {

        return {

            recruited:
                this.recruited.length,

            active:
                this.active.length,

            activeLimit:
                this.getMaxActiveMembers()

        };

    }

    // -------------------------
    // RECLUTAMIENTO
    // -------------------------

    recruit(id) {

        const ally =
            this.catalog[id];

        if (!ally) {

            return {
                ok: false,
                reason: 'unknown'
            };

        }

        if (this.has(id)) {

            return {
                ok: false,
                reason: 'already'
            };

        }

        if (this.isRecruitmentFull()) {

            return {
                ok: false,
                reason: 'full'
            };

        }

        const recruitedAlly = {
            ...ally,
            ability: { ...ally.ability },
            level: 1,
            xp: 0,
            xpToNextLevel: ALLY_PROGRESSION.XP_TO_LEVEL_2,
            health: ALLY_PROGRESSION.STARTING_HEALTH,
            maxHealth: ALLY_PROGRESSION.STARTING_HEALTH,
            poison: null
        };
        this.recruited.push(recruitedAlly);

        return {
            ok: true,
            ally: recruitedAlly
        };

    }

    dismiss(id) {

        this.deactivate(id);

        const index =
            this.recruited.findIndex(
                ally => ally.id === id
            );

        if (index === -1) {
            return false;
        }

        this.recruited.splice(index, 1);

        return true;

    }

    // -------------------------
    // ACTIVOS
    // -------------------------

    activate(id) {

        const ally =
            this.recruited.find(
                member => member.id === id
            );

        if (!ally) {

            return {
                ok: false,
                reason: 'not_recruited'
            };

        }

        if (this.hasActive(id)) {

            return {
                ok: false,
                reason: 'already_active'
            };

        }

        if (ally.health <= 0) {
            return {
                ok: false,
                reason: 'knocked_out'
            };
        }

        if (this.isActivePartyFull()) {

            return {
                ok: false,
                reason: 'party_full'
            };

        }

        this.active.push(ally);

        return {
            ok: true,
            ally
        };

    }

    deactivate(id) {

        const index =
            this.active.findIndex(
                ally => ally.id === id
            );

        if (index === -1) {
            return false;
        }

        this.active.splice(index, 1);

        return true;

    }

    /**
     * Reemplaza todo el grupo activo.
     * Ideal para PartyView.
     */
    setActiveMembers(ids = []) {

        const max =
            this.getMaxActiveMembers();

        this.active =
            this.recruited
                .filter(
                    ally =>
                        ids.includes(ally.id) &&
                        (ally.health ?? ALLY_PROGRESSION.STARTING_HEALTH) > 0
                )
                .slice(0, max);

    }

    // -------------------------
    // COMBATE
    // -------------------------

    actionsFor({ turn, level }) {

        return this.active

            .filter(
                ally =>
                    (ally.health ?? 1) > 0 &&
                    (
                        (turn - 1) %
                        (ally.ability.every ?? 1)
                    ) === 0
            )

            .map(
                ally => ({
                    ally,
                    card: buildAllyCard(
                        ally,
                        level
                    )
                })
            );

    }

    awardCombatExperience(amount = ALLY_PROGRESSION.XP_PER_VICTORY) {
        return this.active.map(ally => {
            ally.level = ally.level ?? 1;
            ally.xp = (ally.xp ?? 0) + amount;
            ally.xpToNextLevel = ally.xpToNextLevel ?? ALLY_PROGRESSION.XP_TO_LEVEL_2;
            ally.maxHealth = ally.maxHealth ?? ALLY_PROGRESSION.STARTING_HEALTH;
            const levelsGained = [];

            while (ally.xp >= ally.xpToNextLevel) {
                ally.xp -= ally.xpToNextLevel;
                ally.level += 1;
                const previousMaxHealth = ally.maxHealth;
                ally.maxHealth = Math.min(
                    ALLY_PROGRESSION.MAX_HEALTH,
                    ally.maxHealth + ALLY_PROGRESSION.HEALTH_PER_LEVEL
                );
                ally.xpToNextLevel += ALLY_PROGRESSION.XP_GROWTH_PER_LEVEL;
                levelsGained.push({
                    level: ally.level,
                    healthGained: ally.maxHealth - previousMaxHealth
                });
            }

            return { ally, amount, levelsGained };
        });
    }

    recoverActive() {
        this.active.forEach(ally => {
            ally.health = ally.maxHealth;
            ally.poison = null;
        });
    }

}