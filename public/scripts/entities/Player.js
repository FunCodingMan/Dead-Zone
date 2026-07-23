import { CONFIG } from '../core/Config.js';
import { Character } from './Character.js';

const PLAYER_WIDTH = 28;
const PLAYER_HEIGHT = 48;
const SPEED = 4;

const BULLET_SPEED = 75;
const BULLET_WIDTH = 5;
const BULLET_HEIGHT = 10;
const SPREAD_FACTOR = 10;
const SHOOT_COOLDOWN_MS = 150;
const DAMAGE = 40;
const DIFF_GUN_FORWARD = 1;
const DIFF_GUN_SIDE = 5;
const MAX_SHOTS_AMOUNT = 50;
const RELOAD_TIME = 2000;

const MAX_HITPOINTS = 100;
const RELOAD_PADDING = 10;
const RELOAD_SIZE = 50;
const HP_PADDING = 10;
const HP_SIZE = 80;
const RELOAD_TEXT_PADDING = 20;
const RELOAD_TEXT_SIZE = 10;
const HITBOX = 28;

export class Player extends Character {
    constructor(map, input, resetPauseTimeCallback) {
        const spawn = map.findFreeSpawn(CONFIG.PLAYER_SYMBOL, null);
        const spawnIndex = map.playerSpawns.indexOf(spawn);
        super(spawn, PLAYER_WIDTH, PLAYER_HEIGHT, spawnIndex, null, resetPauseTimeCallback);

        this.speed = SPEED;
        this.input = input;

        this.bullets = [];
        this.shotsFired = 0;
        this.lastShootTime = performance.now();
        this.damage = DAMAGE;
        this.shotsAmount = MAX_SHOTS_AMOUNT;
        this.isReloading = false;
        this.reloadStartTime = undefined;

        this.hpCanvas = document.createElement('canvas');
        this.hpCanvas.width = HP_SIZE;
        this.hpCanvas.height = HP_SIZE;
        this.hpCtx = this.hpCanvas.getContext('2d');

        this.appliedDamage = 0;
        this.kills = 0;

        this.map = map;

        this.isMultiplayer = false;
        this.hitpoints = MAX_HITPOINTS;
    }

    update(map, canvas, zoom, enemies, targets) {
        if (!this.isAlive) return;
        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;

        const worldMouseX = (this.input.mouseX - canvas.width / 2) / zoom + centerX;
        const worldMouseY = (this.input.mouseY - canvas.height / 2) / zoom + centerY;

        this.angle = Math.atan2(worldMouseY - centerY, worldMouseX - centerX);

        this.move(map, enemies, targets);
        this.shoot(worldMouseX, worldMouseY);

        if (this.input.isJustPressed('KeyR') && !this.isReloading && this.shotsAmount < MAX_SHOTS_AMOUNT) {
            this.isReloading = true;
        }

        //вызов перезарядки вынесен в Game update для обработки во время паузы

        this.handleBullets(map, enemies, targets);
    }

    move(map, enemies, targets) {
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
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;

            nextX += dx * this.speed;
            nextY += dy * this.speed;
        }

        if (nextX < 0) nextX = 0;
        if (nextY < 0) nextY = 0;
        if (nextX + this.w > map.width) nextX = map.width - this.w;
        if (nextY + this.h > map.height) nextY = map.height - this.h;

        const offsetX = (this.w - HITBOX) / 2;
        const offsetY = (this.h - HITBOX) / 2;

        const aliveEnemies = enemies.filter(e => e.isAlive);
        const aliveTargets = targets.filter(t => t.isAlive);

        if (!map.checkCollision({
            x: nextX + offsetX, y: this.y + offsetY, w: HITBOX, h: HITBOX
        }, aliveEnemies, aliveTargets)) {
            this.x = nextX;
        }
        if (!map.checkCollision({
            x: this.x + offsetX, y: nextY + offsetY, w: HITBOX, h: HITBOX
        }, aliveEnemies, aliveTargets)) {
            this.y = nextY;
        }
    }

    shoot(x, y) {
        if (this.input.isMouseDown) {
            const now = performance.now();
            if (now - this.lastShootTime >= SHOOT_COOLDOWN_MS && this.shotsAmount > 0 && !this.isReloading) {
                this.createBullet(x, y);
                this.lastShootTime = now;
                this.isShooting = true;
            } else if (this.shotsAmount <= 0 || this.isReloading) {
                this.isShooting = false;
                this.shotsFired = 0;
            }
        } else {
            this.isShooting = false;
            this.shotsFired = 0;
        }
    }

    createBullet(targetX, targetY) {
        this.shotsAmount--;

        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;

        let spawnX = centerX + Math.cos(this.angle) * DIFF_GUN_FORWARD;
        let spawnY = centerY + Math.sin(this.angle) * DIFF_GUN_FORWARD;

        spawnX += Math.cos(this.angle + Math.PI / 2) * DIFF_GUN_SIDE;
        spawnY += Math.sin(this.angle + Math.PI / 2) * DIFF_GUN_SIDE;

        const dx = targetX - spawnX;
        const dy = targetY - spawnY;
        const length = Math.sqrt(dx * dx + dy * dy);

        let directionX = dx / length;
        let directionY = dy / length;

        this.shotsFired++;

        if (this.shotsFired > 1) {
            directionX += (Math.random() - 0.5) / SPREAD_FACTOR;
            directionY += (Math.random() - 0.5) / SPREAD_FACTOR;
        }

        this.bullets.push({
            x: spawnX, y: spawnY, xDirection: directionX, yDirection: directionY, bulletSpeed: BULLET_SPEED
        });
    }

    handleBullets(map, enemies, targets) {
        const toRemove = [];

        this.bullets.forEach((bullet, index) => {
            bullet.x += bullet.xDirection * bullet.bulletSpeed;
            bullet.y += bullet.yDirection * bullet.bulletSpeed;

            const bulletRect = { 
                x: bullet.x - BULLET_WIDTH / 2, y: bullet.y - BULLET_HEIGHT / 2, w: BULLET_WIDTH, h: BULLET_HEIGHT 
            };

            this.handleBulletsIntersecting(enemies, targets, bulletRect, toRemove, index);

            if (map.checkCollision(bulletRect)) {
                toRemove.push(index);
            }
        });

        for (let i = toRemove.length - 1; i >= 0; i--) {
            this.bullets.splice(toRemove[i], 1);
        }
    }

   handleBulletsIntersecting(enemies, targets, bulletRect, toRemove, bulletIndex) {
        enemies.forEach((enemy) => {
            if (enemy.isAlive) {
                const entityRect = {x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h};
                if (this.map.isIntersecting(bulletRect, entityRect)) {
                    if (!this.isMultiplayer) {
                        this.appliedDamage += this.damage;
                        enemy.takeDamage(this.damage, this.map, CONFIG.ENEMY_SYMBOL);
                    }
                    if (!toRemove.includes(bulletIndex)) {
                        toRemove.push(bulletIndex);
                    }
                }
            }
        });

        targets.forEach((target) => {
            if (target.isAlive) {
                const entityRect = {x: target.x, y: target.y, w: target.w, h: target.h};
                if (this.map.isIntersecting(bulletRect, entityRect)) {
                    if (!this.isMultiplayer) {
                        this.appliedDamage += this.damage;
                        target.takeDamage(this.damage, this.map, CONFIG.TARGET_SYMBOL);
                    }
                    if (!toRemove.includes(bulletIndex)) {
                        toRemove.push(bulletIndex);
                    }
                }
            }
        });
    }

    drawBullets(ctx, bulletImg) {
        this.bullets.forEach(bullet => {
            ctx.save();
            ctx.translate(bullet.x, bullet.y);
            const angle = Math.atan2(bullet.yDirection, bullet.xDirection) + Math.PI / 2;
            ctx.rotate(angle);
            ctx.drawImage(bulletImg, -BULLET_WIDTH / 2, -BULLET_HEIGHT / 2, BULLET_WIDTH, BULLET_HEIGHT);
            ctx.restore();
        });
    }

    drawReloadInterface(ctx, reloadImg, canvas) {
        ctx.save();
        ctx.drawImage(
            reloadImg,
            canvas.width - RELOAD_PADDING - RELOAD_SIZE,
            canvas.height - RELOAD_PADDING - RELOAD_SIZE,
            RELOAD_SIZE, RELOAD_SIZE
        );
        ctx.fillStyle = 'white';
        ctx.font = '18px Arial';
        ctx.fillText(
            this.shotsAmount,
            canvas.width - RELOAD_PADDING - RELOAD_SIZE - RELOAD_TEXT_PADDING - RELOAD_TEXT_SIZE,
            canvas.height - RELOAD_PADDING - RELOAD_TEXT_SIZE
        );
        ctx.restore();
    }

    drawHPInterface(ctx, hearthImg, canvas) {
        this.hpCtx.clearRect(0, 0, HP_SIZE, HP_SIZE);
        this.hpCtx.drawImage(hearthImg, 0, 0, HP_SIZE, HP_SIZE);

        this.hpCtx.globalCompositeOperation = 'source-in';

        const percent = this.hitpoints / MAX_HITPOINTS;
        const height = HP_SIZE * percent;

        this.hpCtx.fillStyle = '#ff0000';
        this.hpCtx.fillRect(0, HP_SIZE - height, HP_SIZE, height);
        this.hpCtx.globalCompositeOperation = 'source-over';

        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.drawImage(hearthImg, HP_PADDING, canvas.height - HP_SIZE - HP_PADDING, HP_SIZE, HP_SIZE);
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

        if (this.reloadStartTime === undefined) {
            this.reloadStartTime = now;
        }

        if (now - this.reloadStartTime >= RELOAD_TIME) {
            this.shotsAmount = MAX_SHOTS_AMOUNT;
            this.isReloading = false;
            this.reloadStartTime = undefined;
        }
    }
}