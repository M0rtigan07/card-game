export class Player {
    constructor(classKey) {
        this.classKey = classKey;
        this.inventory = [];
        this.level = 1;
        this.xp = 0;
        this.xpNext = 100;
        this.gold = 0;
        
        this.setupStatsByClass(classKey);
    }

    setupStatsByClass(type) {
        if (type === 'warrior') {
            this.className = "Guerrero";
            this.health = this.maxHealth = 130;
            this.mana = this.maxMana = 30;
            this.bonusDamage = 10;
            this.goldMultiplier = 1.0;
        } else if (type === 'mage') {
            this.className = "Maga Arcana";
            this.health = this.maxHealth = 90;
            this.mana = this.maxMana = 80;
            this.bonusDamage = 0;
            this.goldMultiplier = 1.0;
        } else if (type === 'rogue') {
            this.className = "Pícaro";
            this.health = this.maxHealth = 105;
            this.mana = this.maxMana = 45;
            this.bonusDamage = 5;
            this.goldMultiplier = 1.3;
        }
    }

    addXp(amount) {
        this.xp += amount;
        if (this.xp >= this.xpNext) {
            this.level++;
            this.xp = 0;
            this.xpNext = Math.floor(this.xpNext * 1.4);
            this.maxHealth += 20;
            this.health = this.maxHealth;
            return true; // Ha subido de nivel
        }
        return false;
    }

    addGold(amount) {
        this.gold += Math.floor(amount * this.goldMultiplier);
    }

    addItem(name, type) {
        this.inventory.push({ name, type });
    }
}