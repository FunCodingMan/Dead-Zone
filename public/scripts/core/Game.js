import { Input } from '../utils/Input.js';
import { CONFIG } from './Config.js';
import { BloodManager } from './BloodManager.js';

const FPS = 60;

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
        
    }

    start(ModeClass) {
        this.stop();

        this.input = new Input(this.canvas, {
            onEscape: () => {
                this.togglePause();
            }
        });

        this.currentMode = new ModeClass(this);
        this.currentMode.init();

        this.isPaused = false;

        this.then = performance.now();
        this.loop(this.then);
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
        this.enemies = [];
        this.targets = [];
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

        const elapsed = currentTime - this.then;

        if (elapsed >= this.fpsInterval) {
            this.then = currentTime - (elapsed % this.fpsInterval);
            this.update();
            this.draw();
        }
    }

    update() {

        if (this.player) {
            this.player.updateReload(this.isPaused, this.totalPauseTime);
        }

        if (this.isPaused) return;
        if (this.player) this.player.update(this.map, this.canvas, this.zoom, this.enemies, this.targets);

        if (this.currentMode) this.currentMode.update();
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
            this.map.draw(this.ctx, this.assets);
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
        this.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                enemy.draw(this.ctx, this.assets.zombie);
            } else if (enemy.isDying) {
                enemy.drawDeath(this.ctx, this.assets.explosions, this.isPaused, this.totalPauseTime);
            }
        });

        this.targets.forEach(target => {
            if (target.isAlive) {
                target.draw(this.ctx, this.assets.target);
            } else if (target.isDying) {
                target.drawDeath(this.ctx, this.assets.explosions, this.isPaused, this.totalPauseTime);
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
                this.player.drawDeath(this.ctx, this.assets.explosions, this.isPaused, this.totalPauseTime);
            }
        }
    }
}