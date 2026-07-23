import { CONFIG } from '../core/Config.js';
import { Character } from './Character.js';

const PLAYER_WIDTH = 36;
const PLAYER_HEIGHT = 48;

const RELOAD_TIME = 2000;

const HITPOINTS = 200;
const RELOAD_PADDING_RIGHT = 10;
const RELOAD_PADDING_BOTTOM = 40;
const TEXT_PADDING_TOP = 10;
const RELOAD_SIZE = 50;
const HP_PADDING = 10;
const HP_SIZE = 80;

const HITBOX = 28;

export class Player extends Character {
    constructor(map, input, playerClass) {
        const spawn = map.findFreeSpawn(CONFIG.PLAYER_SYMBOL, null);
        const spawnIndex = map.playerSpawns.indexOf(spawn);

        super(
            spawn,
            PLAYER_WIDTH,
            PLAYER_HEIGHT,
            spawnIndex,
            null,
            HITPOINTS
        );

        this.speed;
        this.input = input;

        this.shotsFired = 0;
        this.lastShootTime = performance.now();
        this.damage;

        this.shotsAmount;
        this.maxShotsAmount;

        this.shotCooldown;
        this.isReloading = false;
        this.reloadStartTime = undefined;

        this.hpCanvas = document.createElement('canvas');
        this.hpCanvas.width = HP_SIZE;
        this.hpCanvas.height = HP_SIZE;
        this.hpCtx = this.hpCanvas.getContext('2d');

        this.appliedDamage = 0;
        this.kills = 0;

        this.map = map;
        this.playerClass = playerClass;

        this.shotOffsetForward;
        this.shotOffsetSide;

        this.bulletSpeed;

        this.hitpoints = HITPOINTS;
    }

    update(map, canvas, zoom, enemies, targets, boss) {
        if (!this.isAlive) return;

        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;

        const worldMouseX =
            (this.input.mouseX - canvas.width / 2) / zoom + centerX;

        const worldMouseY =
            (this.input.mouseY - canvas.height / 2) / zoom + centerY;

        this.angle = Math.atan2(
            worldMouseY - centerY,
            worldMouseX - centerX
        );

        this.move(map, enemies, targets, boss);

        if (this.playerClass.attackType = CONFIG.SHOOT_ATTACK_TYPE) {
            this.shoot(worldMouseX, worldMouseY);
        }

        if (this.input.isJustPressed('KeyR') && !this.isReloading && this.shotsAmount < this.maxShotsAmount) {
            this.isReloading = true;

            if (this.playerClass.className == CONFIG.SOLDIER_CLASS_NAME) {
                this.reloadSound.play();
            }

            if (this.playerClass.className == CONFIG.FLAMETHROWER_CLASS_NAME) {
                this.flameReloadSound.play();
            }
        }

        this.handleBullets(map, enemies, targets, boss, this.bullets, this);

        this.removeBullets(this.bullets);
    }

    move(map, enemies, targets, boss) {
        let nextX = this.x;
        let nextY = this.y;

        let dx = 0;
        let dy = 0;

        if (this.input.isPressed('KeyW') || this.input.isPressed('ArrowUp')) {
            dy -= 1;
        }

        if (this.input.isPressed('KeyS') || this.input.isPressed('ArrowDown')) {
            dy += 1;
        }

        if (this.input.isPressed('KeyA') || this.input.isPressed('ArrowLeft')) {
            dx -= 1;
        }

        if (this.input.isPressed('KeyD') || this.input.isPressed('ArrowRight')) {
            dx += 1;
        }

        if (dx !== 0 || dy !== 0) {
            this.stepsSound.play();

            const length = Math.sqrt(
                dx * dx + dy * dy
            );

            dx /= length;
            dy /= length;

            nextX += dx * this.speed;
            nextY += dy * this.speed;
        } else {
            this.stepsSound.stop();
        }

        if (nextX < 0) nextX = 0;
        if (nextY < 0) nextY = 0;

        if (nextX + this.w > map.width) {
            nextX = map.width - this.w;
        }

        if (nextY + this.h > map.height) {
            nextY = map.height - this.h;
        }

        const aliveEnemies = enemies.filter(
            e => e.isAlive
        );

        const aliveTargets = targets.filter(
            t => t.isAlive
        );

        if (!map.checkCollision({
                    x: nextX + (this.w - HITBOX) / 2,
                    y: this.y + (this.w - HITBOX) / 2,
                    w: this.w,
                    h: this.h
                },
                aliveEnemies,
                aliveTargets,
                boss
            )
        ) {
            this.x = nextX;
        }

        if (!map.checkCollision({
                    x: this.x + (this.w - HITBOX) / 2,
                    y: nextY + (this.w - HITBOX) / 2,
                    w: this.w, 
                    h: this.h
                },
                aliveEnemies,
                aliveTargets,
                boss
            )
        ) {
            this.y = nextY;
        }
    }

    shoot(x, y) {
        if (this.input.isMouseDown) {
            const now = performance.now();

            if (now - this.lastShootTime >= this.shotCooldown && this.shotsAmount > 0 && !this.isReloading ) {
                this.createBullet(x, y, CONFIG.PLAYER_SYMBOL, this.bullets);

                this.lastShootTime = now;
                this.isShooting = true;
            } else if ( this.shotsAmount <= 0 || this.isReloading ) {
                this.isShooting = false;
            }
        } else {
            this.isShooting = false;
        }
    }

    drawReloadInterface(ctx, reloadImg, canvas) {
        ctx.save();

        const imgX =  canvas.width - RELOAD_PADDING_RIGHT - RELOAD_SIZE;

        const imgY = canvas.height - RELOAD_PADDING_BOTTOM - RELOAD_SIZE;

        ctx.drawImage(reloadImg, imgX,  imgY, RELOAD_SIZE, RELOAD_SIZE);

        ctx.fillStyle = 'white';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        let text;

        if (this.playerClass.className == CONFIG.SOLDIER_CLASS_NAME) {
            text = this.shotsAmount;
        }

        if (this.playerClass.className == CONFIG.FLAMETHROWER_CLASS_NAME) {
            text = Math.round((this.shotsAmount / this.maxShotsAmount) * 100) + '%';
        }

        const textX = imgX + RELOAD_SIZE / 2;

        const textY = imgY + RELOAD_SIZE + TEXT_PADDING_TOP;

        ctx.fillText(text, textX, textY);

        ctx.restore();
    }

    drawHPInterface(ctx, hearthImg, canvas) {
        this.hpCtx.clearRect(0, 0, HP_SIZE, HP_SIZE);

        this.hpCtx.drawImage(
            hearthImg,
            0,
            0,
            HP_SIZE,
            HP_SIZE
        );

        this.hpCtx.globalCompositeOperation = 'source-in';

        const percent = this.hitpoints / HITPOINTS;

        const height = HP_SIZE * percent;

        this.hpCtx.fillStyle = '#ff0000';

        this.hpCtx.fillRect(0, HP_SIZE - height, HP_SIZE, height);

        this.hpCtx.globalCompositeOperation = 'source-over';

        ctx.save();

        ctx.globalAlpha = 0.3;

        ctx.drawImage(hearthImg, HP_PADDING, canvas.height - HP_SIZE - HP_PADDING, HP_SIZE,  HP_SIZE);

        ctx.restore();

        ctx.drawImage(this.hpCanvas, HP_PADDING, canvas.height - HP_SIZE - HP_PADDING);
    }

    updateReload(isPaused, totalPauseTime) {
        if (!this.isReloading) {
            this.reloadStartTime = undefined;
            return;
        }

        if (isPaused) return;

        const now = performance.now() - totalPauseTime;

        if (this.reloadStartTime == undefined) {
            this.reloadStartTime = now;
        }

        if (now - this.reloadStartTime >= RELOAD_TIME) {
            this.shotsAmount = this.maxShotsAmount;

            this.isReloading = false;
            this.reloadStartTime = undefined;
        }
    }

    handlePlayerBulletsIntersecting(enemies, targets, boss, bulletRect, bulletIndex) {
        enemies.forEach((enemy) => {
            if (enemy.isAlive) {
                const entityRect = {x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h};

                if (this.map.isIntersecting(bulletRect, entityRect)) {
                    enemy.takeDamage(this.damage, this.map, CONFIG.PLAYER_SYMBOL);
                    this.handleBulletsIntersectingCommon(bulletIndex, this);
                }
            }
        });

        targets.forEach((target) => {
            if (target.isAlive) {
                const entityRect = {x: target.x, y: target.y, w: target.w, h: target.h};

                if (this.map.isIntersecting(bulletRect, entityRect)) {
                    target.takeDamage(this.damage, this.map, CONFIG.TARGET_SYMBOL);
                    this.handleBulletsIntersectingCommon(bulletIndex, this);
                }
            }
        });

        if (boss) {
            if (boss.isAlive) {
                if (this.map.isIntersecting(bulletRect, boss)) {
                    boss.takeDamage(this.damage, this.map, CONFIG.BOSS_SYMBOL);
                    this.handleBulletsIntersectingCommon(bulletIndex, this);
                }
            }
        }
    }
}
    