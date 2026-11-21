import { setText, wait } from '../ui/helpers.js';

const TRAIL_TRANSITION_MS = 1500;
const REGION_REVEAL_DELAY_MS = 850;

const REGIONS = [
    {
        label: 'UMBRAL',
        title: 'El umbral sin estrellas',
        image: 'img/portalon_abierto.jpg',
        description: 'El portalón queda a tu espalda, aún iluminado por una luz verdosa. El aire es frío y el cielo, negro como la tinta. Unas huellas pequeñas se alejan desde el umbral: la hija del rey pasó por aquí.'
    },
    {
        label: 'BOSQUE',
        title: 'El bosque petrificado',
        image: 'img/moscuro/bosque.jpg',
        description: 'Sigues las huellas entre árboles convertidos en piedra. Junto a ellas aparecen marcas recientes de una bota pequeña; la princesa aún puede estar cerca.'
    },
    {
        label: 'CALZADA',
        title: 'La calzada rota',
        image: 'img/portalon.jpg',
        description: 'Las huellas cruzan una calzada partida sobre un río oscuro. Al otro lado, una cinta real enganchada en las piedras confirma que sigues el camino correcto.'
    },
    {
        label: 'RUINAS',
        title: 'Las ruinas del reino perdido',
        image: 'img/portalon.jpg',
        description: 'Las huellas conducen a unas ruinas cubiertas de enredaderas negras. Se internan en una nueva región; la búsqueda de la hija del rey continúa.'
    }
];

export function createDarkWorldState(entryFloor) {
    return {
        active: true,
        entryFloor,
        location: 0,
        steps: 0,
        mission: createDarkWorldMissionProgress()
    };
}

export function createDarkWorldMissionProgress() {
    return {
        portalCrossed: true,
        royalClueFound: false,
        guardianPassed: false,
        guardianDefeated: false,
        princessTrailFound: false
    };
}

export function advanceDarkWorldState(state) {
    return {
        ...state,
        location: state.location + 1,
        steps: state.steps + 1
    };
}

export class DarkWorld {
    constructor(game) {
        this.game = game;
        this.parallelWorldMessageHandler = null;
    }

    enter() {
        const storyState = this.game.player.storyState;
        if (!storyState.darkWorld?.active) {
            const previousState = storyState.darkWorld;
            storyState.darkWorld = previousState
                ? {
                    ...previousState,
                    active: true,
                    entryFloor: this.game.dungeonLevel,
                    mission: {
                        ...createDarkWorldMissionProgress(),
                        ...previousState.mission
                    }
                }
                : createDarkWorldState(this.game.dungeonLevel);
        }

        document.body.classList.add('dark-world');
        this.game.ui.setRealmMode(true, REGIONS[0].label);
        this.game.loadNextEvent();
    }

    loadNext() {
        const state = this.game.player.storyState.darkWorld;
        const region = REGIONS[Math.min(state.location, REGIONS.length - 1)];
        const beyondRuins = state.location >= REGIONS.length;
        const title = beyondRuins
            ? `Más allá de las ruinas · tramo ${state.location - REGIONS.length + 1}`
            : region.title;
        const view = this.game.exploration.render();

        setText('dungeonTitle', `Mundo Oscuro · ${title}`);
        this.game.exploration.setSceneImage(region.image);
        setText('sceneBadgeOverlay', `MUNDO OSCURO · ${region.label}`);
        this.game.ui.setMerchantGold(false, this.game.player.gold);
        this.game.ui.setRealmMode(true, region.label);

        const description = beyondRuins
            ? `Más allá de las ruinas, las huellas siguen hacia una región desconocida. Llevas ${state.steps} tramos siguiendo el rastro de la hija del rey.`
            : region.description;

        view.setNarrative(description, [
            {
                text: '🔎 Seguir las huellas de la hija del rey',
                callback: () => this.followTracks()
            },
            {
                text: '↩️ Volver al portalón siguiendo tus propias huellas',
                callback: () => this.returnToDungeon()
            }
        ]);
    }

    async followTracks() {
        this.game.audio.play('portal');
        const reducedMotion = typeof window !== 'undefined'
            && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
        if (reducedMotion) {
            this.advanceAlongTracks();
            return;
        }

        document.body.classList.add('trail-transition');
        try {
            await wait(REGION_REVEAL_DELAY_MS);
            this.advanceAlongTracks();
            await wait(TRAIL_TRANSITION_MS - REGION_REVEAL_DELAY_MS);
        } finally {
            document.body.classList.remove('trail-transition');
        }
    }

    advanceAlongTracks() {
        this.game.player.storyState.darkWorld =
            advanceDarkWorldState(this.game.player.storyState.darkWorld);
        if (this.game.player.storyState.darkWorld.location === 2) {
            this.openParallelWorld();
            return;
        }
        this.loadNext();
    }

    openParallelWorld() {
        const frame = document.getElementById('darkWorldFrame');
        const screen = document.getElementById('darkWorldScreen');
        const loading = document.getElementById('darkWorldLoading');
        if (!frame || !screen || !loading) {
            throw new Error('No se encontró la pantalla del Mundo Oscuro.');
        }

        if (!this.parallelWorldMessageHandler && typeof window !== 'undefined'
            && typeof window.addEventListener === 'function') {
            this.parallelWorldMessageHandler = event => this.handleParallelWorldMessage(event);
            window.addEventListener('message', this.parallelWorldMessageHandler);
        }

        if (!frame.dataset.loaded) {
            const companion = this.game.party.active.find(ally => ally.health > 0);
            const storyState = this.game.player.storyState;
            if (!storyState.darkWorld) {
                storyState.darkWorld = createDarkWorldState(this.game.dungeonLevel);
            }
            const mission = storyState.darkWorld.mission
                ?? (storyState.darkWorld.mission = createDarkWorldMissionProgress());
            const worldUrl = new URL('../../mundo-oscuro.html', import.meta.url);
            worldUrl.searchParams.set(
                'companionName',
                companion?.name ?? this.game.playerName ?? 'HÉROE'
            );
            if (companion?.portrait) {
                worldUrl.searchParams.set('companionPortrait', companion.portrait);
            }
            worldUrl.searchParams.set('missionPortalCrossed', mission.portalCrossed ? '1' : '0');
            worldUrl.searchParams.set('missionRoyalClueFound', mission.royalClueFound ? '1' : '0');
            worldUrl.searchParams.set('missionGuardianPassed', mission.guardianPassed ? '1' : '0');
            worldUrl.searchParams.set('missionGuardianDefeated', mission.guardianDefeated ? '1' : '0');
            worldUrl.searchParams.set('missionPrincessTrailFound', mission.princessTrailFound ? '1' : '0');

            frame.addEventListener('load', () => {
                screen.classList.add('parallel-world-ready');
                loading.hidden = true;
            }, { once: true });
            frame.dataset.loaded = 'true';
            frame.src = worldUrl.href;
        }

        this.game.ui.showScreen('darkWorldScreen');
    }

    handleParallelWorldMessage(event) {
        const frame = document.getElementById('darkWorldFrame');
        if (event.origin !== window.location.origin || event.source !== frame?.contentWindow) return;
        if (event.data?.type === 'dark-world:mission-progress') {
            const worldState = this.game.player?.storyState?.darkWorld;
            const progress = event.data.progress;
            const missionFields = [
                'portalCrossed',
                'royalClueFound',
                'guardianPassed',
                'guardianDefeated',
                'princessTrailFound'
            ];
            if (!worldState?.active || !progress
                || !missionFields.every(field => typeof progress[field] === 'boolean')) return;

            worldState.mission = {
                ...createDarkWorldMissionProgress(),
                ...worldState.mission,
                portalCrossed: progress.portalCrossed,
                royalClueFound: progress.royalClueFound,
                guardianPassed: progress.guardianPassed,
                guardianDefeated: progress.guardianDefeated,
                princessTrailFound: progress.princessTrailFound
            };
            return;
        }
        if (event.data?.type !== 'dark-world:start-minotaur-combat') return;
        if (this.game.combat.inCombat) return;

        this.game.ui.showScreen('gameScreen');
        this.game.combat.start({
            name: 'Minotauro del Laberinto',
            hp: 320,
            maxHp: 320,
            atk: 28,
            img: 'img/moscuro/minotauro_retrato_combate.png',
            deckId: 'minotauro',
            speaker: {
                id: 'minotauro',
                name: 'Minotauro del Laberinto',
                archetype: 'Guardián feroz del laberinto',
                voice: 'Habla con gruñidos breves y amenazas directas.'
            },
            returnToDarkWorld: true
        });
    }

    returnFromMinotaurCombat() {
        const frame = document.getElementById('darkWorldFrame');
        if (!frame?.contentWindow) {
            throw new Error('No se encontró la aventura del Mundo Oscuro para regresar del combate.');
        }

        this.game.ui.showScreen('darkWorldScreen');
        const targetOrigin = window.location.origin === 'null' ? '*' : window.location.origin;
        frame.contentWindow.postMessage(
            { type: 'dark-world:minotaur-defeated' },
            targetOrigin
        );
    }

    returnToDungeon() {
        this.game.audio.play('portalReturn');
        const state = this.game.player.storyState.darkWorld;
        this.game.player.storyState.darkWorld = { ...state, active: false };
        document.body.classList.remove('dark-world');
        this.game.ui.setRealmMode(false, this.game.dungeonLevel);
        this.game.loadNextEvent();
    }
}
