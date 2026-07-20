import { Input } from '../utils/Input.js';
import { CONFIG } from './Config.js';
import { BloodManager } from './BloodManager.js';
import { Sound } from './Sound.js';

const RANDOM_SOUND_CHANCE = 0.03;
const MAX_RANDOM_SOUND_INTERVAL = 5000;

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
        this.targets = [];
        this.input = null;
        this.currentMode = null;

        this.loop = this.loop.bind(this);

        this.isGameEnded;

        this.bloodManager = new BloodManager();

        this.pauseStartTime = 0;
        this.totalPauseTime = 0;

        this.playerSprite;
        this.playerReloadSprite;
        this.bulletSprite;
        this.reloadIconSprite;

        this.initSounds();
        
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

        if (Math.random() < RANDOM_SOUND_CHANCE) {this.zoom
            const randomIndex = Math.floor(Math.random() * this.randomEnemySounds.length);
            const sound = this.randomEnemySounds[randomIndex];
            sound.stop();
            sound.play();
            this.lastRandomSoundTime = currentTime;
        }
    }

    initializeClassSprites() {
        switch (this.player.playerClass.className) {
            case CONFIG.SOLDIER_CLASS_NAME: 
                this.playerSprite = this.assets.soldier;
                this.playerReloadSprite = this.assets.reloadSoldier;
                this.bulletSprite = this.assets.bullet;
                this.reloadIcon = this.assets.reloadIcon;
                break;
            case CONFIG.FLAMETHROWER_CLASS_NAME:
                this.playerSprite = this.assets.flamethrower;
                this.playerReloadSprite = this.assets.flamethrowerReload;
                this.bulletSprite = this.assets.flame;
                this.reloadIcon = this.assets.flamethrowerReloadIcon;
                break;
        }
    }

    initializePlayerParameters() {
        if (this.player.playerClass.attackType = CONFIG.SHOOT_ATTACK_TYPE) {
            this.player.maxShotsAmount = this.player.playerClass.ammo;
            this.player.shotsAmount = this.player.maxShotsAmount;
            this.player.shotCooldown = this.player.playerClass.shootCooldown;
            this.player.bulletWidth = this.player.playerClass.bulletWidth;
            this.player.bulletHeight = this.player.playerClass.bulletHeight;
            this.player.shotOffsetForward = this.player.playerClass.shotOffsetForward;
            this.player.shotOffsetSide = this.player.playerClass.shotOffsetSide;
            this.player.bulletSpeed = this.player.playerClass.bulletSpeed; 
        }
        this.player.speed = this.player.playerClass.speed;
        this.player.damage = this.player.playerClass.damage;
    }

    async start(ModeClass) {
        this.stop();

        this.input = new Input(this.canvas, {
            onEscape: () => {
                if (this.player && this.player.isAlive) {
                    this.togglePause();
                }
            }
        });

        this.currentMode = new ModeClass(this);
        await this.currentMode.init();
        this.initializeClassSprites();
        this.initializePlayerParameters();

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

    loop() {
        if (this.isGameEnded) return;

        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(this.loop);
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
            this.player.drawReloadInterface(this.ctx, this.reloadIcon, this.canvas);
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
                    this.player.draw(this.ctx, this.playerSprite);
                    if (!this.isPaused) this.player.animateShots(this.ctx, this.assets.shot1, this.assets.shot2, this.player);
                } else {
                    this.player.draw(this.ctx, this.playerReloadSprite);
                }
                this.player.drawBullets(this.ctx, this.bulletSprite);
            } else if (this.player.isDying) {
                this.player.drawDeath(this.ctx, this.assets.explosions, this.isPaused, this.totalPauseTime);
            }
        }
    }
}