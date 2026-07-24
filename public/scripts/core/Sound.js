export class Sound {
    constructor(src) {
        this.audio = new Audio(src);
        this.isPlaying = false;
        this.baseVolume = 1;
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
        this.baseVolume = Math.max(0, Math.min(1, value));
        this.audio.volume = this.baseVolume;
    }

    updateDistanceVolume(sourceX, sourceY, listenerX, listenerY, maxDistance = 1200) {
        if (listenerX === undefined || listenerY === undefined) {
            this.audio.volume = this.baseVolume;
            return 1;
        }

        const dist = Math.hypot(sourceX - listenerX, sourceY - listenerY);

        if (dist >= maxDistance) {
            this.audio.volume = 0;
            return 0;
        }

        const volumeMultiplier = 1 - (dist / maxDistance);
        this.audio.volume = this.baseVolume * (volumeMultiplier * volumeMultiplier);

        return this.audio.volume;
    }

    playAtDistance(sourceX, sourceY, listenerX, listenerY, maxDistance = 1200) {
        const vol = this.updateDistanceVolume(sourceX, sourceY, listenerX, listenerY, maxDistance);
        if (vol > 0) {
            this.play();
        }
    }
}