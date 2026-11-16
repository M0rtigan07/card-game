export class HeroSheetView {
    constructor() {
        this.player = null;
        this.dungeonLevel = 1;
        this.overlay = document.createElement('div');
        this.overlay.className = 'hero-sheet-overlay';
        this.overlay.hidden = true;
        this.overlay.innerHTML = `
            <section
                class="hero-sheet-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="heroSheetTitle"
            >
                <header class="hero-sheet-header">
                    <div>
                        <p class="hero-sheet-kicker">CRÓNICA DEL AVENTURERO</p>
                        <h2 id="heroSheetTitle">Hoja de héroe</h2>
                    </div>
                    <button class="hero-sheet-close" type="button" aria-label="Cerrar hoja de héroe">×</button>
                </header>

                <div class="hero-sheet-content">
                    <section class="hero-card-frame hero-sheet-card" aria-label="Retrato del héroe">
                        <div class="hero-card-image-box">
                            <img class="hero-sheet-image" alt="">
                        </div>
                        <span class="character-tag hero-sheet-name"></span>
                    </section>

                    <div class="hero-sheet-stats">
                        <div class="hero-sheet-stat stat-item">
                            <span>HÉROE</span>
                            <span>Lvl <b data-stat="level">1</b></span>
                        </div>
                        <div class="hero-sheet-stat stat-item">
                            <span>❤️ Salud</span>
                            <b data-stat="health">0/0</b>
                        </div>
                        <div class="hero-sheet-stat stat-item">
                            <span>🔮 Maná</span>
                            <b data-stat="mana">0/0</b>
                        </div>
                        <div class="hero-sheet-stat stat-item">
                            <span>💰 Oro</span>
                            <span><b data-stat="gold">0</b> GP</span>
                        </div>
                        <div class="hero-sheet-stat stat-item">
                            <span>🏰 Planta</span>
                            <b data-stat="floor">1</b>
                        </div>

                        <div class="hero-sheet-xp">
                            <div class="hero-sheet-xp-heading">
                                <span>PROGRESO DE EXPERIENCIA</span>
                                <b data-stat="xp-text">0 / 100 XP</b>
                            </div>
                            <div
                                class="xp-container"
                                role="progressbar"
                                aria-label="Experiencia del héroe"
                                aria-valuemin="0"
                                aria-valuemax="100"
                                aria-valuenow="0"
                            >
                                <div class="xp-bar"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <footer class="hero-sheet-footer">
                    <span>ESTADO DEL PERSONAJE</span>
                    <span>ESC / B CERRAR</span>
                </footer>
            </section>
        `;

        document.body.appendChild(this.overlay);
        this.panel = this.overlay.querySelector('.hero-sheet-panel');
        this.closeButton = this.overlay.querySelector('.hero-sheet-close');
        this.image = this.overlay.querySelector('.hero-sheet-image');
        this.name = this.overlay.querySelector('.hero-sheet-name');
        this.xpMeter = this.overlay.querySelector('.xp-container');
        this.xpBar = this.overlay.querySelector('.xp-bar');

        this.closeButton.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', event => {
            if (event.target === this.overlay) this.close();
        });
        document.addEventListener('keydown', event => {
            if (!this.overlay.hidden && (event.key === 'Escape' || event.key.toLowerCase() === 'b')) {
                this.close();
            }
        });
    }

    open(player, dungeonLevel) {
        this.overlay.hidden = false;
        this.refresh(player, dungeonLevel);
        this.closeButton.focus();
    }

    close() {
        this.overlay.hidden = true;
        document.getElementById('openHeroSheetBtn')?.focus();
    }

    refresh(player = this.player, dungeonLevel = this.dungeonLevel) {
        if (!player) return;

        this.player = player;
        this.dungeonLevel = dungeonLevel;
        if (this.overlay.hidden) return;

        this.render();
    }

    render() {
        const { player, dungeonLevel } = this;
        const xpPercent = Math.min(100, Math.floor((player.xp / player.maxXp) * 100));

        this.panel.querySelector('#heroSheetTitle').textContent =
            `${player.className} · Hoja de héroe`;
        this.image.src = player.img;
        this.image.alt = `Retrato de ${player.name}`;
        this.name.textContent = player.name.toUpperCase();
        this.panel.querySelector('[data-stat="level"]').textContent = player.level;
        this.panel.querySelector('[data-stat="health"]').textContent =
            `${player.health}/${player.maxHealth}`;
        this.panel.querySelector('[data-stat="mana"]').textContent =
            `${player.mana}/${player.maxMana}`;
        this.panel.querySelector('[data-stat="gold"]').textContent = player.gold;
        this.panel.querySelector('[data-stat="floor"]').textContent = dungeonLevel;
        this.panel.querySelector('[data-stat="xp-text"]').textContent =
            `${player.xp} / ${player.maxXp} XP`;
        this.xpBar.style.width = `${xpPercent}%`;
        this.xpMeter.setAttribute('aria-valuemax', String(player.maxXp));
        this.xpMeter.setAttribute('aria-valuenow', String(player.xp));
    }
}
