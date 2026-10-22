export class UIManager {
    constructor() {
        this.typewriterTimer = null;
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

    updateStats(player, dungeonLevel) {
        document.getElementById('heroClass').textContent = player.className;
        document.getElementById('lvlVal').textContent = player.level;
        document.getElementById('hpVal').textContent = `${player.health}/${player.maxHealth}`;
        document.getElementById('manaVal').textContent = `${player.mana}/${player.maxMana}`;
        document.getElementById('goldVal').textContent = player.gold;
        document.getElementById('dungeonLevel').textContent = dungeonLevel;

        const xpPercent = Math.min(100, Math.floor((player.xp / player.maxXp) * 100));
        document.getElementById('xpBar').style.width = `${xpPercent}%`;
        document.getElementById('xpText').textContent = `${player.xp} / ${player.maxXp} XP`;

        const invList = document.getElementById('playerInventory');
        invList.innerHTML = '';
        player.inventory.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.name}</span><small style="color:#d8b4fe;">${item.effect}</small>`;
            invList.appendChild(li);
        });
    }

    logEvent(msg) {
        const list = document.getElementById('eventList');
        document.querySelectorAll('#eventList li').forEach(el => el.classList.remove('last-event'));
        const li = document.createElement('li');
        li.textContent = msg;
        li.classList.add('last-event');
        list.insertBefore(li, list.firstChild);
    }

    setMessage(msg) {
        document.getElementById('messageDisplay').textContent = msg;
    }

    displayCard(card) {
        const display = document.getElementById('cardDisplay');
        display.innerHTML = `
            <div class="card">
                <img src="${card.image}" alt="${card.name}">
                <h3>${card.name}</h3>
                <p>${card.desc}</p>
            </div>
        `;
    }

    showGameOver() {
        document.getElementById('gameover-modal').style.display = 'flex';
    }
}