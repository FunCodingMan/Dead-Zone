import { CONFIG } from '../core/Config.js';
import { Character } from './Character.js';

const PLAYER_WIDTH = 36;
const PLAYER_HEIGHT = 48;

const DIFF_GUN_FORWARD = 5;
const DIFF_GUN_SIDE = 5;
const RELOAD_TIME = 2000;

const MAX_HITPOINTS = 100;
const RELOAD_PADDING_RIGHT = 10;
const RELOAD_PADDING_BOTTOM = 40;
const TEXT_PADDING_TOP = 10;
const RELOAD_SIZE = 50;
const HP_PADDING = 10;
const HP_SIZE = 80;
const RELOAD_TEXT_PADDING = 20;
const RELOAD_TEXT_SIZE = 10;
const HITBOX = 28;

export class Player extends Character {
    constructor(map, input, playerClass) {
        const spawn = map.findFreeSpawn(CONFIG.PLAYER_SYMBOL, null);
        const spawnIndex = map.playerSpawns.indexOf(spawn);
        super(spawn, PLAYER_WIDTH, PLAYER_HEIGHT, spawnIndex, null);

        this.speed;
        this.input = input;

        this.bullets = [];
        this.shotsFired = 0;
        this.lastShootTime = performance.now();
        this.damage;

        this.shotsAmount;
        this.maxShotsAmount;

        this.bulletWidth;
        this.bulletHeight;

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

        this.bulletsToRemove = [];

        this.shotOffsetForward;
        this.shotOffsetSide;

        this.bulletSpeed;
    }

    update(map, canvas, zoom, enemies, targets) {

        if (!this.isAlive) return;
        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;

        const worldMouseX = (this.input.mouseX - canvas.width / 2) / zoom + centerX;
        const worldMouseY = (this.input.mouseY - canvas.height / 2) / zoom + centerY;

        this.angle = Math.atan2(worldMouseY - centerY, worldMouseX - centerX);

        this.move(map, enemies, targets);

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

        //вызов перезарядки вынесен в Game update для обработки во время паузы

        this.handleBullets(map, enemies, targets);
        this.removeBullets();
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
            this.stepsSound.play();

            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;

            nextX += dx * this.speed;
            nextY += dy * this.speed;
        } else {
            this.stepsSound.stop();
        }

        if (nextX < 0) nextX = 0;
        if (nextY < 0) nextY = 0;
        if (nextX + this.w > map.width) nextX = map.width - this.w;
        if (nextY + this.h > map.height) nextY = map.height - this.h;

        const aliveEnemies = enemies.filter(e => e.isAlive);
        const aliveTargets = targets.filter(t => t.isAlive);

        if (!map.checkCollision({
            x: nextX + (this.w - HITBOX) / 2, y: this.y + (this.w - HITBOX) / 2, w: this.w, h: this.h
        }, aliveEnemies, aliveTargets)) {
            this.x = nextX;
        }
        if (!map.checkCollision({
            x: this.x + (this.w - HITBOX) / 2, y: nextY + (this.w - HITBOX) / 2, w: this.w, h: this.h
        }, aliveEnemies, aliveTargets)) {
            this.y = nextY;
        }
    }

    shoot(x, y) {
        if (this.input.isMouseDown) {
            const now = performance.now();
            if (now - this.lastShootTime >= this.shotCooldown && this.shotsAmount > 0 && !this.isReloading) {
                this.createBullet(x, y);
                this.lastShootTime = now;
                this.isShooting = true;
            } else if (this.shotsAmount <= 0 || this.isReloading) {
                this.isShooting = false;
            }
        } else {
            this.isShooting = false;
        }
    }

    createBullet(targetX, targetY) {
        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;

        let spawnX = centerX + Math.cos(this.angle) * this.shotOffsetForward;
        let spawnY = centerY + Math.sin(this.angle) * this.shotOffsetForward;

        spawnX += Math.cos(this.angle + Math.PI / 2) * this.shotOffsetSide;
        spawnY += Math.sin(this.angle + Math.PI / 2) * this.shotOffsetSide;

        const dx = targetX - spawnX;
        const dy = targetY - spawnY;
        const length = Math.sqrt(dx * dx + dy * dy);

        let directionX = dx / length;
        let directionY = dy / length;

        if (this.playerClass.className == CONFIG.SOLDIER_CLASS_NAME) {
            this.createBulletSoldier(directionX, directionY, spawnX, spawnY);
        }

        if (this.playerClass.className == CONFIG.FLAMETHROWER_CLASS_NAME) {
            this.createBulletFlamethrower(directionX, directionY, spawnX, spawnY, this.angle);
        }
    }

    createBulletSoldier(directionX, directionY, spawnX, spawnY) {
        
    }

    createBulletFlamethrower(directionX, directionY, spawnX, spawnY, angle) {
        
    }

    handleBullets(map, enemies, targets) {
        this.bulletsToRemove = [];

        this.bullets.forEach((bullet, index) => {
            bullet.x += bullet.xDirection * bullet.bulletSpeed;
            bullet.y += bullet.yDirection * bullet.bulletSpeed;

            const bulletRect = { 
                x: bullet.x - this.bulletWidth / 2, y: bullet.y - this.bulletHeight / 2, w: this.bulletWidth, h: this.bulletHeight 
            };

            this.handleBulletsIntersecting(enemies, targets, bulletRect, this.bulletsToRemove, index);

            if (this.playerClass.className == CONFIG.FLAMETHROWER_CLASS_NAME) {
                this.countOffset(bullet, index);
            }

            if (this.playerClass.className == CONFIG.SOLDIER_CLASS_NAME) {
                this.playHitHardSounds(bulletRect);
            }

            if (map.checkCollision(bulletRect)) {
                this.bulletsToRemove.push(index);
            }

        });
    }

    playHitHardSounds(bulletRect) {

    }

    countOffset(bullet, index) {

    }

    removeBullets() {
        for (let i = this.bulletsToRemove.length - 1; i >= 0; i--) {
            this.bullets.splice(this.bulletsToRemove[i], 1);
        }
    }

    handleBulletsIntersecting(enemies, targets, bulletRect, bulletIndex) {
        enemies.forEach((enemy) => {
            if (enemy.isAlive) {
                const entityRect = {x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h};
                if (this.map.isIntersecting(bulletRect, entityRect)) {
                    this.appliedDamage += this.damage;
                    enemy.takeDamage(this.damage, this.map, CONFIG.PLAYER_SYMBOL);
                    if (!this.bulletsToRemove.includes(bulletIndex)) {
                        this.bulletsToRemove.push(bulletIndex);
                    }
                }
            }
        });

        targets.forEach((target) => {
            if (target.isAlive) {
                const entityRect = {x: target.x, y: target.y, w: target.w, h: target.h};
                if (this.map.isIntersecting(bulletRect, entityRect)) {
                    this.appliedDamage += this.damage;
                    target.takeDamage(this.damage, this.map, CONFIG.TARGET_SYMBOL);
                    if (!this.bulletsToRemove.includes(bulletIndex)) {
                        this.bulletsToRemove.push(bulletIndex);
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
            ctx.drawImage(bulletImg, -this.bulletWidth / 2, -this.bulletHeight / 2, this.bulletWidth, this.bulletHeight);
            ctx.restore();
        });
    }

    drawReloadInterface(ctx, reloadImg, canvas) {
        ctx.save();
        
        const imgX = canvas.width - RELOAD_PADDING_RIGHT - RELOAD_SIZE;
        const imgY = canvas.height - RELOAD_PADDING_BOTTOM - RELOAD_SIZE;
        
        ctx.drawImage(reloadImg, imgX, imgY, RELOAD_SIZE, RELOAD_SIZE);
        
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

        if (this.reloadStartTime == undefined) {
            this.reloadStartTime = now;
        }

        if (now - this.reloadStartTime >= RELOAD_TIME) {
            this.shotsAmount = this.maxShotsAmount;
            this.isReloading = false;
            this.reloadStartTime = undefined;
        }
    }
}