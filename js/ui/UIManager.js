import { createAllyStatus } from './AllyStatus.js';

const ROMAN_NUMERALS = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
];

function toRomanNumeral(number) {
    let remaining = number;
    let numeral = '';

    for (const [value, symbol] of ROMAN_NUMERALS) {
        while (remaining >= value) {
            numeral += symbol;
            remaining -= value;
        }
    }

    return numeral;
}

export class UIManager {
    constructor() {
        this.typewriterTimer = null;
        this.getParty = null;  // lo asigna Game: devuelve los aliados activos
        this.isAllyActive = null;
        this.onDismissAlly = null; // lo asigna Game: se llama con el id del aliado al pulsar ✕
        this.onOpenParty = null;
        this.onOpenHeroSheet = null;
        this.refreshHeroSheet = null;
        this.onOpenInventory = null;
        this.refreshInventory = null;
        this.acting = new Set(); // aliados que están actuando ahora mismo (se resaltan)
        this.allyNotices = [];
        this.allyNoticeTimer = null;
        this.allyNoticeHost = null;
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.add('active');
        }
    }

    typewriterIntro(text, callback) {
        const box = document.getElementById('introText');
        if (!box) return;

        if (this.typewriterTimer) {
            clearInterval(this.typewriterTimer);
            this.typewriterTimer = null;
        }

        box.textContent = '';
        let i = 0;

        this.typewriterTimer = setInterval(() => {
            if (i < text.length) {
                box.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(this.typewriterTimer);
                this.typewriterTimer = null;
                if (callback) callback();
            }
        }, 30);
    }

    setLoadingProgress(percent, message = "CARGANDO...") {
        const bar = document.getElementById('loadingBar');
        const txt = document.getElementById('loadingText');
        if (bar) bar.style.width = `${percent}%`;
        if (txt) txt.textContent = message;
    }

    updateStats(player, dungeonLevel) {
        this.refreshHeroSheet?.(player, dungeonLevel);

        const floorDisplay = document.getElementById('sidebarFloorRoman');
        if (floorDisplay && Number.isInteger(dungeonLevel) && dungeonLevel > 0) {
            floorDisplay.textContent = toRomanNumeral(dungeonLevel);
        }

        const levelDisplay = document.getElementById('sidebarHeroLevel');
        if (levelDisplay) levelDisplay.textContent = String(player.level);

        const inventoryCount =
            player.inventory.reduce((total, item) => total + (item.qty || 1), 0);
        this.updateMerchantGold(player.gold);

        const inventoryCountEl =
            document.getElementById('inventoryCount');
        if (inventoryCountEl) {
            inventoryCountEl.textContent =
                `${inventoryCount} ${inventoryCount === 1 ? 'objeto' : 'objetos'}`;
        }

        this.renderParty(this.getParty?.() ?? []);
        this.refreshInventory?.(player);
    }

    setMerchantGold(visible, amount) {
        const badge = document.getElementById('merchantGoldBadge');
        if (!badge) return;

        if (visible) this.updateMerchantGold(amount);
        badge.hidden = !visible;
    }

    updateMerchantGold(amount) {
        const display = document.getElementById('merchantGoldAmount');
        if (display) {
            display.textContent = new Intl.NumberFormat('es-ES').format(amount);
        }
    }

    /** Panel "Grupo": la carta de cada aliado, lo que hace por ti y un botón para despedirle. */
    renderParty(members) {

        const sidebar =
            document.getElementById('leftSidebar');

        if (!sidebar) return;

        let host =
            document.getElementById('allyParty');

        if (!host) {

            host =
                document.createElement('div');

            host.id = 'allyParty';

            sidebar.appendChild(host);

        }

        host.replaceChildren();

        // TÍTULO

        const title =
            document.createElement('h2');

        title.textContent = 'Compañía';

        host.appendChild(title);

        // BOTÓN COMPAÑÍA

        const manageBtn =
            document.createElement('button');

        manageBtn.className =
            'party-manage-btn';

        manageBtn.innerHTML =
            '👥 Compañía';

        manageBtn.addEventListener(
            'click',
            () => {

                this.onOpenParty?.();

            }
        );

        host.appendChild(manageBtn);

        // Solo se muestran aliados activos; el resto se consulta en Compañía.

        if (members.length === 0) {

            const info =
                document.createElement('small');

            info.className =
                'party-empty';

            info.textContent =
                'Sin aliados en combate.';

            host.appendChild(info);

            return;

        }

        // PERSONAJES ACTIVOS

        members.forEach(ally => {
            const inBattle = this.isAllyActive?.(ally.id) ?? ally.status === 'battle';
            const card =
                document.createElement('div');

            card.id =
                `ally-card-${ally.id}`;

            card.className =
                `party-member${inBattle ? ' in-battle' : ''}${ally.health <= 0 ? ' knocked-out' : ''}${this.acting.has(ally.id) ? ' acting' : ''}`;

            const image =
                document.createElement('img');

            image.className =
                'party-card';

            image.alt =
                ally.name;

            image.onerror = () => {

                image.onerror = null;

                image.src =
                    'img/guerrero.png';

            };

            image.src =
                ally.card;

            const info =
                document.createElement('div');

            info.className =
                'party-info';

            const name =
                document.createElement('b');

            name.textContent =
                ally.name;

            const ability =
                document.createElement('small');

            ability.textContent =
                ally.ability.name;

            const status =
                document.createElement('small');

            status.className =
                `party-status-indicator${inBattle ? ' in-battle' : ' in-reserve'}`;

            status.textContent =
                ally.health <= 0
                    ? '💫 Fuera de combate'
                    : inBattle ? '⚔️ En combate' : '🏕️ En campamento';

            info.append(
                name,
                ability,
                status,
                createAllyStatus(ally, 'sidebar')
            );

            card.append(
                image,
                info
            );

            host.appendChild(card);

        });

    }

    /** Resalta un momento la carta del aliado que acaba de actuar. */
    flashAlly(id) {
        this.acting.add(id);
        document.getElementById(`ally-card-${id}`)?.classList.add('acting');

        setTimeout(() => {
            this.acting.delete(id);
            document.getElementById(`ally-card-${id}`)?.classList.remove('acting');
        }, 900);
    }

    logEvent(msg) {
        const list = document.getElementById('eventList');
        if (!list) return;

        // Quitar la clase 'last-event' de los elementos anteriores
        document.querySelectorAll('#eventList li').forEach(el => el.classList.remove('last-event'));

        const li = document.createElement('li');
        li.textContent = msg;
        li.classList.add('last-event');

        // Insertar el nuevo evento arriba del todo
        list.insertBefore(li, list.firstChild);

        // Limitar el número máximo de acciones guardadas (ejemplo: máximo 6 u 7 visibles)
        const maxLogs = 7;
        while (list.children.length > maxLogs) {
            list.removeChild(list.lastChild); // Elimina el evento más antiguo que se sale por abajo
        }
    }

    showAllyNotice(message, type = 'level-up') {
        if (!this.allyNoticeHost) {
            this.allyNoticeHost = document.createElement('div');
            this.allyNoticeHost.className = 'ally-notice-host';
            this.allyNoticeHost.setAttribute('role', 'status');
            this.allyNoticeHost.setAttribute('aria-live', 'assertive');
            this.allyNoticeHost.setAttribute('aria-atomic', 'true');
            document.body.appendChild(this.allyNoticeHost);
        }

        this.allyNotices.push({ message, type });
        this.showNextAllyNotice();
    }

    showNextAllyNotice() {
        if (this.allyNoticeTimer || this.allyNotices.length === 0) return;

        const { message, type } = this.allyNotices.shift();
        const notice = document.createElement('div');
        notice.className = `ally-combat-notice ally-combat-notice-${type}`;
        notice.textContent = message;
        this.allyNoticeHost.replaceChildren(notice);

        this.allyNoticeTimer = setTimeout(() => {
            notice.classList.add('is-leaving');
            this.allyNoticeTimer = setTimeout(() => {
                this.allyNoticeTimer = null;
                this.showNextAllyNotice();
            }, 220);
        }, 2800);
    }

    showGameOver() {
        document.getElementById('gameover-modal').style.display = 'flex';
    }
}