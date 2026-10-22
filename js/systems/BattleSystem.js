export class BattleSystem {
    constructor(audioManager, uiManager) {
        this.audio = audioManager;
        this.ui = uiManager;
        this.activeEnemy = null;
    }

    startBattle(enemyData) {
        this.activeEnemy = { ...enemyData };
        this.ui.showBattleModal(this.activeEnemy);
    }

    executeTurn(action, player) {
        if (!this.activeEnemy) return;
        this.audio.play('hit');

        let dmg = 15 + player.bonusDamage;
        let msg = "";

        if (action === 'attack') {
            this.activeEnemy.hp -= dmg;
            msg = `Atacas e infliges ${dmg} de daño.`;
        } else if (action === 'defend') {
            dmg = Math.floor(dmg / 2);
            this.activeEnemy.hp -= dmg;
            msg = `Te defiendes y contraatacas por ${dmg}.`;
        } else if (action === 'spell') {
            if (player.mana >= 12) {
                player.mana -= 12;
                this.activeEnemy.hp -= 40;
                msg = `¡Lanzas un Hechizo por 40 de daño!`;
            } else {
                msg = `¡Maná insuficiente!`;
            }
        }

        if (this.activeEnemy.hp <= 0) {
            const leveledUp = player.addXp(120);
            player.addGold(250);
            this.ui.hideBattleModal();
            this.ui.logEvent(`¡Has derrotado a ${this.activeEnemy.name}!`);
            if (leveledUp) this.ui.logEvent(`¡SUBIDA DE NIVEL! Ahora eres Nivel ${player.level}`);
            this.ui.updateStats(player);
            return;
        }

        player.health -= this.activeEnemy.attack;
        msg += ` ${this.activeEnemy.name} te ataca e inflige ${this.activeEnemy.attack} HP.`;
        
        this.ui.appendBattleLog(msg);
        this.ui.updateBattleEnemyStats(this.activeEnemy);
        this.ui.updateStats(player);

        if (player.health <= 0) {
            this.ui.hideBattleModal();
            this.ui.showGameOver();
        }
    }
}