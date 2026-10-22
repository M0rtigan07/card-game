import { BASE_DECK } from '../config.js';

export class Deck {
    constructor() {
        this.drawPile = [];
        this.discardPile = [];
        this.reset();
    }

    reset() {
        this.drawPile = JSON.parse(JSON.stringify(BASE_DECK));
        this.discardPile = [];
    }

    drawCard() {
        let isReshuffled = false;
        
        if (this.drawPile.length === 0) {
            if (this.discardPile.length > 0) {
                this.drawPile = [...this.discardPile];
                this.discardPile = [];
                isReshuffled = true;
            } else {
                this.reset();
            }
        }

        const index = Math.floor(Math.random() * this.drawPile.length);
        const card = this.drawPile.splice(index, 1)[0];
        this.discardPile.push(card);

        return { card, isReshuffled };
    }
}