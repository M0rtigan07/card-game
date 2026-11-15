// js/systems/Party.js

import { ALLIES } from '../data/allyCatalog.js';

/**
 * Convierte una habilidad de aliado en una carta.
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

    constructor(catalog = ALLIES) {

        this.catalog = catalog;

        // Todos los aliados reclutados
        this.recruited = [];

        // Los activos para combate
        this.active = [];
    }

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

    /**
     * Reclutar personaje.
     */
    recruit(id) {

        const ally = this.catalog[id];

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

        this.recruited.push(ally);

        return {
            ok: true,
            ally
        };

    }

    /**
     * Activar para combate.
     */
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

        this.active.push(ally);

        return {
            ok: true,
            ally
        };

    }

    /**
     * Sacar del grupo activo.
     */
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
     * Expulsar completamente.
     */
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

    /**
     * Aliados activos este turno.
     */
    actionsFor({ turn, level }) {

        return this.active

            .filter(
                ally =>
                    (turn - 1) %
                    (ally.ability.every ?? 1) === 0
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

}