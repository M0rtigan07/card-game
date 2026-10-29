export class Player {
    constructor(classKey) {
        this.classKey = classKey;

        const configs = {
            'warrior': { name: 'Guerrero', hp: 130, mana: 30, dmg: 10 },
            'mage': { name: 'Maga Arcana', hp: 90, mana: 80, dmg: 18 },
            'rogue': { name: 'Pícaro', hp: 105, mana: 45, dmg: 12 }
        };

        const config = configs[classKey] || configs['warrior'];

        this.className = config.name;
        this.name = 'HÉROE';   // nombre elegido por el jugador
        this.img = '';         // retrato del héroe
        this.attackBonus = 0;  // daño extra en ataques (veneno de filo)
        this.energyBonus = 0;  // energía extra por turno en combate
        this.health = config.hp;
        this.maxHealth = config.hp;
        this.mana = config.mana;
        this.maxMana = config.mana;
        this.gold = 50;
        this.level = 1;
        this.xp = 0;
        this.maxXp = 100;
        this.inventory = [];
    }

    addGold(amount) {
        this.gold += amount;
    }

    addXp(amount) {
        this.xp += amount;
        if (this.xp >= this.maxXp) {
            this.level++;
            this.xp -= this.maxXp;
            this.maxXp = Math.floor(this.maxXp * 1.5);
            this.maxHealth += 20;
            this.health = this.maxHealth;
            return true;
        }
        return false;
    }
}