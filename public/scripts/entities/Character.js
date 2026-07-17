import { CONFIG } from "../core/Config.js";
import { Sound } from "../core/Sound.js";

export const MAX_HITPOINTS = 100;
const EXPLOSION_DURATION_MS = 400;
const SHOT_FRAME_SIZE = 100;
const SHOT_FRAME_X_OFFSET = -2;
const SHOT_FRAME_Y_OFFSET = 4;

const TARGET_PULSE_DURATION = 300;
const TARGET_PULSE_SCALE = 0.95;

export class Character {
    constructor(spawn, width, height, spawnIndex, bloodManager, resetPauseTimeCallback) {
        this.spawnPoint = spawn;
        this.spawnIndex = spawnIndex;
        this.x = spawn.x;
        this.y = spawn.y;
        this.w = width;
        this.h = height;
        this.angle = 0;
        this.speed;

        this.hitpoints = MAX_HITPOINTS;
        this.isAlive = true;
        this.isDying = false;
        this.isShooting = false;

        this.deathStartTime = 0;

        this.shotFrameIndex = 0;
        this.lastShotFrameTime = 0;
        this.shotFrameInterval = 100;

        this.isTargetPulsing = false;
        this.pulseStartTime = 0;
        this.currentScale = 1;

        this.onDeathCallBack = null;

        this.bloodManager = bloodManager;

        this.resetPauseTime = resetPauseTimeCallback;

        this.currentDeathFrame;
        this.deathElapsed;

        this.currentFrequentSoundIndex = 0;
        this.initSounds();
    }

    initSounds() {
        this.shootSounds = [];
        for (let i = 0; i < 5; i++) {
            const newSound = new Sound('../../assets/sounds/shot.mp3');
            newSound.setVolume(0.3);
            this.shootSounds.push(newSound);
        }

        this.hitHardSounds = [];
        for (let i = 0; i < 5; i++) {
            const newSound = new Sound('../../assets/sounds/hit-hard.mp3');
            newSound.setVolume(1);
            this.hitHardSounds.push(newSound);
        }

        this.hitTargetSounds = [];
        for (let i = 0; i < 5; i++) {
            const newSound = new Sound('../../assets/sounds/hit-target.mp3');
            newSound.setVolume(1);
            this.hitTargetSounds.push(newSound);
        }

        
        this.hitEnemySound = new Sound('../../assets/sounds/hit.mp3');
        this.hitEnemySound.setVolume(0.5);

        this.reloadSound = new Sound('../../assets/sounds/reload.mp3');

        this.explosionSound = new Sound('../../assets/sounds/explosion.mp3');

        this.stepsSound = new Sound('../../assets/sounds/steps.mp3');
    }

    onDeath(callback) {
        this.onDeathCallback = callback;
    }

    playFrequentSound(array) {
        const sounds = array;

        const sound = sounds[this.currentFrequentSoundIndex];
        this.currentFrequentSoundIndex = (this.currentFrequentSoundIndex + 1) % sounds.length;

        sound.stop();
        sound.play();
    }

    takeDamage(damage, map, symbol) {
        if (!this.isAlive) return;

        this.hitpoints -= damage;

        if (symbol === CONFIG.TARGET_SYMBOL) {
            this.startPulse();
            this.playFrequentSound(this.hitTargetSounds);
        } else {
            this.bloodManager.addBloodSpot(this);
            this.hitEnemySound.play();
        }

        if (this.hitpoints <= 0) {
            this.isAlive = false;
            this.isDying = true;
            this.deathStartTime = performance.now();

            this.explosionSound.play();

            if (this.onDeathCallback) {
                this.onDeathCallback();
            }

            if (this.spawnPoint) {
                this.spawnPoint.isFree = true;
                if (this.spawnIndex !== -1 && !map.diedTargets.includes(this.spawnIndex)) {
                    map.diedTargets.push({index: this.spawnIndex, time: performance.now()});
                }
            }
        }
    }

    draw(ctx, image) {
        this.updatePulse();

        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        ctx.rotate(this.angle + Math.PI / 2);

        if (this.isTargetPulsing) {
            const scaledW = this.w * this.currentScale;
            const scaledH = this.h * this.currentScale;
            ctx.drawImage(image, -scaledW / 2, -scaledH / 2, scaledW, scaledH);
        } else {
            ctx.drawImage(image, -this.w / 2, -this.h / 2, this.w, this.h);
        }

        ctx.restore();
    }

    drawDeath(ctx, explosions, isPaused, totalPauseTime) {
        if (!this.isDying) return;

        const gameNow = performance.now() - totalPauseTime;

        if (this.deathGameStartTime === undefined) {
            this.deathGameStartTime = gameNow;
        }

        let elapsed;
        if (isPaused) {
            elapsed = this.deathElapsed || 0;
        } else {
            elapsed = gameNow - this.deathGameStartTime;
            this.deathElapsed = elapsed;
        }

        if (elapsed >= EXPLOSION_DURATION_MS) {
            this.isDying = false;
            this.deathGameStartTime = undefined;
            return;
        }

        const safeElapsed = Math.max(0, elapsed);
        const progress = safeElapsed / EXPLOSION_DURATION_MS;

        const frameIndex = Math.min(
            Math.max(0, Math.floor(progress * explosions.length)),
            explosions.length - 1
        );
        const currentFrame = explosions[frameIndex];

        if (!currentFrame) return;

        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        ctx.drawImage(currentFrame, -(this.w * 1.2) / 2, -(this.h * 1.2) / 2, this.w * 1.2, this.h * 1.2);
        ctx.restore();
    }

    animateShots(ctx, shot1Img, shot2Img, player) {
        if (!this.isShooting) return;

        const now = performance.now();

        if (now - this.lastShotFrameTime >= this.shotFrameInterval) {
            this.shotFrameIndex = (this.shotFrameIndex + 1) % 2;
            this.lastShotFrameTime = now;
        }

        const currentShot = this.shotFrameIndex === 0 ? shot1Img : shot2Img;

        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        ctx.rotate(this.angle);

        ctx.drawImage(
            currentShot,
            -SHOT_FRAME_SIZE / 4 - SHOT_FRAME_X_OFFSET,
            -SHOT_FRAME_SIZE / 2 + SHOT_FRAME_Y_OFFSET,
            SHOT_FRAME_SIZE,
            SHOT_FRAME_SIZE
        );

        ctx.restore();
    }

    startPulse() {
        this.isTargetPulsing = true;
        this.pulseStartTime = performance.now();
        this.currentScale = 1;
    }

    updatePulse() {
        if (!this.isTargetPulsing) return;

        const now = performance.now();
        const elapsed = now - this.pulseStartTime;

        if (elapsed >= TARGET_PULSE_DURATION) {
            this.isTargetPulsing = false;
            this.currentScale = 1;
            return;
        }

        const progress = elapsed / TARGET_PULSE_DURATION;
        const scale = 1 + (TARGET_PULSE_SCALE - 1) * Math.sin(progress * Math.PI);
        this.currentScale = scale;
    }
}