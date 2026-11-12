export class UIManager {
    constructor() {
        this.typewriterTimer = null;
        this.onUseItem = null; // lo asigna Game: se llama con el id del objeto al pulsar "Usar"
        this.getParty = null;  // lo asigna Game: devuelve los aliados del grupo
        this.onDismissAlly = null; // lo asigna Game: se llama con el id del aliado al pulsar ✕
        this.acting = new Set(); // aliados que están actuando ahora mismo (se resaltan)
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
        // 1. Mostrar la clase arriba junto al título de la hoja
        const classEl = document.getElementById('heroClass');
        if (classEl && player.className) {
            classEl.textContent = player.className.toUpperCase();
        }

        // 2. Mostrar el nombre personalizado en el pie de la foto de la carta
        const heroTag = document.getElementById('heroClassTag');
        const savedName = localStorage.getItem('mazo_hero_name') || /** @type {any} */ (window).game?.playerName;
        if (heroTag && savedName) {
            heroTag.textContent = savedName.toUpperCase();
        }

        // 3. Resto de estadísticas del panel
        document.getElementById('lvlVal').textContent = player.level;
        document.getElementById('hpVal').textContent = `${player.health}/${player.maxHealth}`;
        document.getElementById('manaVal').textContent = `${player.mana}/${player.maxMana}`;
        document.getElementById('goldVal').textContent = player.gold;
        document.getElementById('dungeonLevel').textContent = dungeonLevel;

        const xpPercent = Math.min(100, Math.floor((player.xp / player.maxXp) * 100));
        document.getElementById('xpBar').style.width = `${xpPercent}%`;
        document.getElementById('xpText').textContent = `${player.xp} / ${player.maxXp} XP`;

        const invList = document.getElementById('playerInventory');
        if (invList) {
            invList.innerHTML = '';
            player.inventory.forEach(item => {
                const li = document.createElement('li');
                li.className = `inv-item inv-${item.kind || 'relic'}`;

                const name = document.createElement('span');
                name.textContent = item.qty > 1 ? `${item.name} x${item.qty}` : item.name;

                const effect = document.createElement('small');
                effect.className = 'inv-effect';
                effect.textContent = item.effect;

                li.append(name, effect);

                if (item.kind === 'consumable' && this.onUseItem) {
                    const useButton = document.createElement('button');
                    useButton.className = 'inv-use-btn';
                    useButton.textContent = 'Usar';
                    useButton.addEventListener('click', () => this.onUseItem(item.id));
                    li.appendChild(useButton);
                }
                invList.appendChild(li);
            });
        }

        this.renderParty(this.getParty?.() ?? []);
    }

    /** Panel "Grupo": la carta de cada aliado, lo que hace por ti y un botón para despedirle. */
    renderParty(members) {
        const sidebar = document.getElementById('leftSidebar');
        if (!sidebar) return;

        let host = document.getElementById('allyParty');
        if (!host) {
            host = document.createElement('div');
            host.id = 'allyParty';
            sidebar.appendChild(host);
        }
        host.replaceChildren();
        if (members.length === 0) return;

        const title = document.createElement('h2');
        title.textContent = 'Grupo';
        host.appendChild(title);

        members.forEach(ally => {
            const card = document.createElement('div');
            card.id = `ally-card-${ally.id}`;
            card.className = `party-member${this.acting.has(ally.id) ? ' acting' : ''}`;

            const image = document.createElement('img');
            image.className = 'party-card';
            image.alt = ally.name;
            image.onerror = () => { image.onerror = null; image.src = 'img/guerrero.png'; };
            image.src = ally.card;

            const info = document.createElement('div');
            info.className = 'party-info';
            const name = document.createElement('b');
            name.textContent = ally.name;
            const ability = document.createElement('small');
            ability.textContent = `${ally.ability.name}: ${ally.ability.text}`;
            info.append(name, ability);

            const dismiss = document.createElement('button');
            dismiss.className = 'party-dismiss';
            dismiss.title = 'Despedir';
            dismiss.textContent = '✕';
            dismiss.addEventListener('click', () => this.onDismissAlly?.(ally.id));

            card.append(image, info, dismiss);
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

    showGameOver() {
        document.getElementById('gameover-modal').style.display = 'flex';
    }
}