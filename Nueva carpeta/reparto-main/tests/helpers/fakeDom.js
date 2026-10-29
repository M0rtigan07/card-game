// tests/helpers/fakeDom.js
// Un "navegador de mentira" mínimo para probar el juego con `node --test`, sin abrir ningún navegador.
// Instala document, window, localStorage, fetch y temporizadores instantáneos como variables globales.
// Hay que llamarlo ANTES de importar el código del juego.

export function installFakeDom({ fetchHandler } = {}) {
    const elements = new Map();
    const queries = new Map();
    const storage = new Map();

    const makeElement = (id = '') => {
        const classes = new Set();
        let html = '';
        const el = {
            id,
            children: [],
            style: {},
            dataset: {},
            listeners: {},
            className: '',
            textContent: '',
            src: '',
            disabled: false,
            onclick: null,
            onerror: null,
            offsetWidth: 0,
            removed: false,
            classList: {
                add: (c) => classes.add(c),
                remove: (c) => classes.delete(c),
                contains: (c) => classes.has(c),
                toggle: (c, force) => ((force ?? !classes.has(c)) ? classes.add(c) : classes.delete(c))
            },
            addEventListener(type, fn) { el.listeners[type] = fn; },
            click() { el.listeners.click?.(); el.onclick?.(); },
            appendChild(child) { el.children.push(child); return child; },
            append(...kids) { el.children.push(...kids); },
            replaceChildren() { el.children = []; },
            insertBefore() {},
            removeChild() {},
            remove() { el.removed = true; },
            // Como en un navegador, vaciar el HTML elimina los hijos
            get innerHTML() { return html; },
            set innerHTML(value) { html = value; if (value === '') el.children = []; },
            get firstChild() { return null; },
            get lastChild() { return null; }
        };
        return el;
    };

    const body = makeElement('body');

    /** Devuelve (y crea si hace falta) el elemento con ese id. */
    const element = (id) => {
        if (!elements.has(id)) elements.set(id, makeElement(id));
        return elements.get(id);
    };

    globalThis.document = {
        getElementById: element,
        querySelectorAll: (selector) => queries.get(selector) ?? [],
        createElement: () => makeElement(),
        body
    };

    globalThis.window = {
        addEventListener() {},
        AudioContext: class {
            constructor() { this.currentTime = 0; this.state = 'running'; this.destination = {}; }
            createOscillator() {
                return { connect() {}, start() {}, stop() {}, frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} } };
            }
            createGain() {
                return { connect() {}, gain: { setValueAtTime() {}, linearRampToValueAtTime() {} } };
            }
            resume() {}
        }
    };

    globalThis.localStorage = {
        getItem: (key) => storage.get(key) ?? 'TESTER',
        setItem: (key, value) => storage.set(key, value)
    };

    // Respuestas del backend simuladas
    const defaultFetch = async (_url, options) => {
        const payload = JSON.parse(options.body);
        const reply = (data) => ({ ok: true, json: async () => data });

        if (payload.type === 'exploration') {
            return reply({
                npcType: 'automata',
                description: 'Un autómata de bronce bloquea el puente.',
                choices: [{ text: 'Luchar', action: 'combat' }, { text: 'Rodear', action: 'pass' }]
            });
        }
        if (payload.type === 'npc_interaction') return reply({ description: 'Respuesta de la IA' });
        return reply({ story: 'Historia de prueba' });
    };
    globalThis.fetch = fetchHandler ?? defaultFetch;

    // Los temporizadores se ejecutan enseguida: las pausas del juego no hacen esperar a los tests
    const realSetTimeout = globalThis.setTimeout;
    globalThis.setTimeout = (fn) => realSetTimeout(fn, 0);

    return {
        element,
        body,
        storage,
        /** Registra lo que devolverá document.querySelectorAll(selector). */
        setQuery: (selector, list) => queries.set(selector, list),
        makeElement
    };
}
