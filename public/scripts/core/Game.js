import { Input } from '../utils/Input.js';

export class Game {
    constructor(canvas, assets, onPauseToggle) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.assets = assets;
        this.onPauseToggle = onPauseToggle;

        this.isPaused = false;
        this.animationId = null;
        this.zoom = 1.5;

        this.map = null;
        this.player = null;
        this.enemies = [];
        this.input = null;
        this.currentMode = null;

        this.loop = this.loop.bind(this);
    }

    start(ModeClass) {
        this.stop();

        this.input = new Input(this.canvas, {
            onEscape: () => {
                if (this.player && this.player.isAlive) this.togglePause();
            }
        });

        this.currentMode = new ModeClass(this);
        this.currentMode.init();

        this.isPaused = false;
        this.loop();
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
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused && this.input) {
            this.input.reset();
        }
        this.onPauseToggle(this.isPaused);
    }

    loop() {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(this.loop);
    }

    update() {
        if (this.isPaused) return;
        if (this.player) this.player.update(this.map, this.canvas, this.zoom, this.enemies);

        //TODO: Добавить ии врагов (если есть)

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
            this.map.drawBlood(this.ctx, this.assets.blood);
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
                this.player.drawDeath(this.ctx, this.assets.explosions);
            }
        }

        this.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                enemy.draw(this.ctx, this.assets.soldier);
            } else if (enemy.isDying) {
                enemy.drawDeath(this.ctx, this.assets.explosions);
            }
        });

        this.ctx.restore();

        if (this.player && this.player.isAlive) {
            this.player.drawReloadInterface(this.ctx, this.assets.reloadIcon, this.canvas);
            this.player.drawHPInterface(this.ctx, this.assets.heartIcon, this.canvas);
        }

        if (this.currentMode) {
            this.currentMode.drawUI(this.ctx, this.canvas);
        }
    }
}