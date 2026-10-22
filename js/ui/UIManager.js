export class UIManager {

    constructor() {
        this.typewriterTimer = null; // Guardamos el timer aquí
    }

    typewriterIntro(text, callback) {
        const box = document.getElementById('introText');

        // 1. LIMPIAR CUALQUIER ANIMACIÓN ANTERIOR EN CURSO
        if (this.typewriterTimer) {
            clearInterval(this.typewriterTimer);
            this.typewriterTimer = null;
        }

        box.textContent = '';
        let i = 0;

        // 2. INICIAR LA NUEVA ANIMACIÓN
        this.typewriterTimer = setInterval(() => {
            if (i < text.length) {
                box.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(this.typewriterTimer);
                this.typewriterTimer = null;
                if (callback) callback();
            }
        }, 25);
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    }

    updateStats(player, dungeonLevel = 1) {
        document.getElementById('heroClass').textContent = player.className;
        document.getElementById('hpVal').textContent = `${player.health}/${player.maxHealth}`;
        document.getElementById('manaVal').textContent = `${player.mana}/${player.maxMana}`;
        document.getElementById('goldVal').textContent = Math.floor(player.gold);
        document.getElementById('lvlVal').textContent = player.level;
        document.getElementById('dungeonLevel').textContent = dungeonLevel;

        const xpPerc = Math.min(100, (player.xp / player.xpNext) * 100);
        document.getElementById('xpBar').style.width = `${xpPerc}%`;
        document.getElementById('xpText').textContent = `${player.xp} / ${player.xpNext} XP`;

        this.updateInventory(player.inventory);
    }

    updateInventory(inventory) {
        const list = document.getElementById('playerInventory');
        if (inventory.length === 0) {
            list.innerHTML = `<li style="color:#888; font-style:italic; justify-content:center;">Sin objetos</li>`;
            return;
        }
        list.innerHTML = '';
        inventory.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span>⚔️ ${item.name}</span> <small style="color:var(--gold);">${item.type}</small>`;
            list.appendChild(li);
        });
    }

    displayCard(card) {
        document.getElementById('cardDisplay').innerHTML = `
            <div class="card">
                <img src="${card.img}" alt="${card.name}" onerror="this.src='img/gameover_scroll.png'">
                <h3>${card.name}</h3>
                <p>${card.desc}</p>
            </div>
        `;
    }

    logEvent(msg) {
        const list = document.getElementById('eventList');
        const items = list.querySelectorAll('li');
        items.forEach(el => el.classList.remove('last-event'));
        const li = document.createElement('li');
        li.className = 'last-event';
        li.textContent = msg;
        list.prepend(li);
    }

    setMessage(txt) {
        document.getElementById('messageDisplay').textContent = txt;
    }

    typewriterIntro(text, callback) {
        const box = document.getElementById('introText');
        box.textContent = '';
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                box.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(timer);
                if (callback) callback();
            }
        }, 30);
    }

    showBattleModal(enemy) {
        document.getElementById('battle-title').textContent = `¡Combate: ${enemy.name}!`;
        document.getElementById('battle-desc').textContent = `Enemigo HP: ${enemy.hp} | Ataque: ${enemy.attack}`;
        document.getElementById('battle-event-list').innerHTML = `<li>¡${enemy.name} aparece!</li>`;
        document.getElementById('battle-modal').style.display = 'flex';
    }

    hideBattleModal() { document.getElementById('battle-modal').style.display = 'none'; }
    updateBattleEnemyStats(enemy) { document.getElementById('battle-desc').textContent = `Enemigo HP: ${enemy.hp} | Ataque: ${enemy.attack}`; }
    appendBattleLog(msg) {
        const li = document.createElement('li');
        li.textContent = msg;
        document.getElementById('battle-event-list').prepend(li);
    }
    showGameOver() { document.getElementById('gameover-modal').style.display = 'flex'; }
}