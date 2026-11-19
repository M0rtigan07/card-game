export class AudioManager {
    constructor() {
        const AudioCtx = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
        this.ctx = new AudioCtx();
    }

    play(type) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        if (type === 'sega') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
            osc.start(); osc.stop(this.ctx.currentTime + 0.4);
        } else if (type === 'card') {
            osc.frequency.setValueAtTime(300, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
            osc.start(); osc.stop(this.ctx.currentTime + 0.12);
        } else if (type === 'hit') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, this.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
            osc.start(); osc.stop(this.ctx.currentTime + 0.2);
        } else if (type === 'blip') {
            // Pitido corto de la máquina de escribir de las conversaciones
            osc.type = 'square';
            osc.frequency.setValueAtTime(520 + Math.random() * 120, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
            osc.start(); osc.stop(this.ctx.currentTime + 0.04);
        } else if (type === 'portal' || type === 'portalReturn') {
            const returning = type === 'portalReturn';
            const startFrequency = returning ? 660 : 110;
            const endFrequency = returning ? 110 : 660;
            const duration = 0.9;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(startFrequency, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(endFrequency, this.ctx.currentTime + duration);
            gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.14, this.ctx.currentTime + 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        }
    }
}