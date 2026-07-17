export class Sound {
    constructor(src) {
        this.audio = new Audio(src);
        this.isPlaying = false;
    }

    play() {
        this.audio.play();
        this.isPlaying = true;
    }

    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.isPlaying = false;
    }

    setVolume(value) {
        this.audio.volume = Math.max(0, Math.min(1, value));
    }
}