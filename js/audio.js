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
        }
    }
}