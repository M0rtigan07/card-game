export class InventoryView {
    constructor(onUseItem) {
        this.onUseItem = onUseItem;
        this.player = null;
        this.filter = 'all';
        this.overlay = document.createElement('div');
        this.overlay.className = 'inventory-overlay';
        this.overlay.hidden = true;
        this.overlay.innerHTML = `
            <section
                class="inventory-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="inventoryTitle"
            >
                <header class="inventory-header">
                    <div>
                        <p class="inventory-kicker">ARCHIVO DEL CAZADOR</p>
                        <h2 id="inventoryTitle">Inventario</h2>
                    </div>
                    <button class="inventory-close" type="button" aria-label="Cerrar inventario">×</button>
                </header>

                <div class="inventory-status" aria-live="polite"></div>

                <div class="inventory-layout">
                    <nav class="inventory-tabs" aria-label="Categorías del inventario">
                        <button type="button" data-filter="all" aria-pressed="true">Todo</button>
                        <button type="button" data-filter="consumable" aria-pressed="false">Consumibles</button>
                        <button type="button" data-filter="relic" aria-pressed="false">Reliquias</button>
                    </nav>
                    <div class="inventory-content">
                        <p class="inventory-summary"></p>
                        <div class="inventory-items" aria-live="polite"></div>
                    </div>
                </div>

                <footer class="inventory-footer">
                    <span>SELECCIONA UN OBJETO</span>
                    <span>ESC / B CERRAR</span>
                </footer>
            </section>
        `;

        document.body.appendChild(this.overlay);
        this.status = this.overlay.querySelector('.inventory-status');
        this.summary = this.overlay.querySelector('.inventory-summary');
        this.items = this.overlay.querySelector('.inventory-items');
        this.closeButton = this.overlay.querySelector('.inventory-close');

        this.closeButton.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', event => {
            if (event.target === this.overlay) this.close();
        });
        this.overlay.querySelectorAll('[data-filter]').forEach(button => {
            button.addEventListener('click', () => {
                this.filter = button.dataset.filter;
                this.render();
            });
        });
        document.addEventListener('keydown', event => {
            if (!this.overlay.hidden && (event.key === 'Escape' || event.key.toLowerCase() === 'b')) {
                this.close();
            }
        });
    }

    open(player) {
        this.player = player;
        this.filter = 'all';
        this.overlay.hidden = false;
        this.render();
        this.closeButton.focus();
    }

    close() {
        this.overlay.hidden = true;
        document.getElementById('openInventoryBtn')?.focus();
    }

    refresh(player = this.player) {
        this.player = player;
        if (!this.overlay.hidden) this.render();
    }

    render() {
        if (!this.player) return;

        const { health, maxHealth, mana, maxMana, gold, inventory } = this.player;
        const items = inventory.filter(item => this.filter === 'all' || item.kind === this.filter);
        const count = inventory.reduce((total, item) => total + (item.qty || 1), 0);

        this.status.textContent =
            `HP ${health}/${maxHealth}   ◆   MANÁ ${mana}/${maxMana}   ◆   ORO ${gold} GP`;
        this.summary.textContent =
            `${count} ${count === 1 ? 'objeto' : 'objetos'} · ${items.length} en esta sección`;
        this.overlay.querySelectorAll('[data-filter]').forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.filter === this.filter));
        });
        this.items.replaceChildren();

        if (items.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'inventory-empty';
            empty.textContent = inventory.length
                ? 'No hay objetos en esta sección.'
                : 'Tu bolsa está vacía. Sigue explorando para encontrar equipo.';
            this.items.appendChild(empty);
            return;
        }

        items.forEach(item => {
            const card = document.createElement('article');
            card.className = `inventory-item-card ${item.kind === 'consumable' ? 'is-consumable' : 'is-relic'}`;

            const header = document.createElement('div');
            header.className = 'inventory-item-header';

            const name = document.createElement('h3');
            name.textContent = item.name;

            const quantity = document.createElement('span');
            quantity.className = 'inventory-quantity';
            quantity.textContent = `×${item.qty || 1}`;

            const kind = document.createElement('span');
            kind.className = 'inventory-kind';
            kind.textContent = item.kind === 'consumable' ? 'CONSUMIBLE' : 'RELIQUIA ACTIVA';

            const effect = document.createElement('p');
            effect.className = 'inventory-effect';
            effect.textContent = item.effect;

            header.append(name, quantity);
            card.append(header, kind, effect);

            if (item.kind === 'consumable') {
                const useButton = document.createElement('button');
                useButton.className = 'inv-use-btn';
                useButton.type = 'button';
                useButton.textContent = 'Usar';
                useButton.addEventListener('click', () => {
                    if (this.onUseItem(item.id)) this.render();
                });
                card.appendChild(useButton);
            }

            this.items.appendChild(card);
        });
    }
}
