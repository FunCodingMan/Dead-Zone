import { Input } from '../utils/Input.js';
import { CONFIG } from './Config.js';
import { BloodManager } from './BloodManager.js';
import { Sound } from './Sound.js';

const RANDOM_SOUND_CHANCE = 0.03;
const MAX_RANDOM_SOUND_INTERVAL = 5000;

const FPS = 60;
const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;
const BASE_ZOOM = 1.5;

export class Game {
    constructor(canvas, assets, onPauseToggle) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.assets = assets;
        this.onPauseToggle = onPauseToggle;

        this.fps = FPS;
        this.fpsInterval = 1000 / this.fps;
        this.then = 0;


        this.isPaused = false;
        this.animationId = null;
        this.zoom = 1.5;

        this.map = null;
        this.player = null;
        this.enemies = [];
        this.targets = [];
        this.input = null;
        this.currentMode = null;

        this.loop = this.loop.bind(this);

        this.isGameEnded;

        this.bloodManager = new BloodManager();

        this.pauseStartTime = 0;
        this.totalPauseTime = 0;
        this.renderWidth = 1920;
        this.renderHeight = 1080;

        this.lastFrameTime = 0;

        window.addEventListener('resize', this.resizeHandler);
        this.resizeHandler();

        this.initSounds();

    }

    setResolution(width, height) {
        this.renderWidth = width;
        this.renderHeight = height;
        this.resizeHandler();
    }

    initSounds() {
        this.randomEnemySounds = [
            new Sound('../../assets/sounds/zombie-1.mp3'),
            new Sound('../../assets/sounds/zombie-2.mp3')
        ];

        this.lastRandomSoundTime = 0;
        this.randomSoundInterval = MAX_RANDOM_SOUND_INTERVAL;
    }

    playRandomEnemySound() {
        const currentTime = performance.now();

        if (currentTime - this.lastRandomSoundTime < this.randomSoundInterval) {
            return;
        }

        if (Math.random() < RANDOM_SOUND_CHANCE) {
            const randomIndex = Math.floor(Math.random() * this.randomEnemySounds.length);
            const sound = this.randomEnemySounds[randomIndex];
            const aliveEnemies = this.enemies.filter(e => e.isAlive);
            if (aliveEnemies.length > 0 && this.player) {
                const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];

                sound.stop();
                sound.playAtDistance(randomEnemy.x, randomEnemy.y, this.player.x, this.player.y);

                this.lastRandomSoundTime = currentTime;
            }
        }
    }

    resizeHandler = () => {
        this.canvas.width = this.renderWidth;
        this.canvas.height = this.renderHeight;

        this.zoom = (this.renderHeight / BASE_HEIGHT) * BASE_ZOOM;
    };

    start(ModeClass, ...args) {
        this.stop();

        this.isGameEnded = false;

        this.input = new Input(this.canvas, {
            onEscape: () => {
                this.togglePause();
            }
        });

        this.currentMode = new ModeClass(this, ...args);
        this.currentMode.init();

        this.isPaused = false;

        this.lastFrameTime = performance.now();
        this.loop(this.lastFrameTime);
    }

    stop() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.currentMode && this.currentMode.destroy) {
            this.currentMode.destroy();
        }
        if (this.input) {
            this.input.destroyListeners();
            this.input = null;
        }
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
        this.enemies = [];
        this.targets = [];

        this.player = null;
        this.map = null;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.pauseStartTime = performance.now();
            if (this.input) {
                this.input.reset();
            }
        } else {
            this.totalPauseTime += performance.now() - this.pauseStartTime;
            this.pauseStartTime = 0;
        }
        this.onPauseToggle(this.isPaused);
    }

    loop(currentTime) {
        if (this.isGameEnded) return;

        this.animationId = requestAnimationFrame(this.loop);

        let dt = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;

        if (dt > 0.1) dt = 0.1;

        this.update(dt);
        this.draw();
    }

    update(dt) {

        if (this.player) {
            this.player.updateReload(this.isPaused, this.totalPauseTime);
        }

        const isOnline = this.currentMode && this.currentMode.isMultiplayer === true;

        if (this.isPaused && !isOnline) return;

        if (this.player) {
            if (this.isPaused && isOnline) {
                this.player.handleBullets(this.map, this.enemies, this.targets, dt);
            } else {
                this.player.update(this.map, this.canvas, this.zoom, this.enemies, this.targets, dt);
            }
        }

        if (this.currentMode) this.currentMode.update(dt);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);


        this.ctx.save();
        if (this.player) {
            this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.scale(this.zoom, this.zoom);
            this.ctx.translate(-this.player.x - this.player.w / 2, -this.player.y - this.player.h / 2);
        }

        if (this.map) {
            let camX = this.canvas.width / 2;
            let camY = this.canvas.height / 2;
            if (this.player) {
                camX = this.player.x + this.player.w / 2;
                camY = this.player.y + this.player.h / 2;
            }
            this.map.draw(this.ctx, this.assets, camX, camY, this.canvas.width, this.canvas.height, this.zoom);
        }

        if (this.bloodManager) {
             this.bloodManager.drawBlood(this.ctx, this.assets.blood);
        }

        this.drawEntities();

        this.ctx.restore();

        if (this.player && this.player.isAlive) {
            this.player.drawReloadInterface(this.ctx, this.assets.reloadIcon, this.canvas);
            this.player.drawHPInterface(this.ctx, this.assets.heartIcon, this.canvas);
        }

        if (this.currentMode) {
            this.currentMode.drawUI(this.ctx, this.canvas);
        }
    }

    drawEntities() {
        const isOnline = this.currentMode && this.currentMode.isMultiplayer === true;
        const animPaused = this.isPaused && !isOnline;
        const pauseTime = isOnline ? 0 : this.totalPauseTime;

        this.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                enemy.draw(this.ctx, this.assets.zombie);
            } else if (enemy.isDying) {
                enemy.drawDeath(this.ctx, this.assets.explosions, animPaused, pauseTime);
            }
        });

        this.targets.forEach(target => {
            if (target.isAlive) {
                target.draw(this.ctx, this.assets.target);
            } else if (target.isDying) {
                target.drawDeath(this.ctx, this.assets.explosions, animPaused, pauseTime);
            }
        })

        if (this.currentMode && typeof this.currentMode.draw === 'function') {
            this.currentMode.draw(this.ctx);
        }

        if (this.player) {
            if (this.player.isAlive) {
                if (!this.player.isReloading) {
                    this.player.draw(this.ctx, this.assets.soldier);
                    if (!this.isPaused) this.player.animateShots(this.ctx, this.assets.shot1, this.assets.shot2, this.player);
                } else {
                    this.player.draw(this.ctx, this.assets.reloadSoldier);
                }
                this.player.drawBullets(this.ctx, this.assets.bullet);
            } else if (this.player.isDying) {
                this.player.drawDeath(this.ctx, this.assets.explosions, animPaused, pauseTime);
            }
        }

    }
}