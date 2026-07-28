import { CONFIG } from '../core/Config.js';
import { Character } from './Character.js';

const PLAYER_WIDTH = 28;
const PLAYER_HEIGHT = 48;
const SPEED = 4;

const BULLET_SPEED = 55;
const BULLET_WIDTH = 3;
const BULLET_HEIGHT = 45;

const BULLET_REAL_WIDTH = 4;
const BULLET_REAL_HEIGHT = 4;

const BASE_SPREAD = 5;
const MAX_SPREAD = 15;
const SPREAD_FACTOR = 10;
const SPREAD_RECOVERY_TIME_MS = 400;
const SHOOT_COOLDOWN_MS = 150;
const DAMAGE = 20;
const DIFF_GUN_FORWARD = 1;
const DIFF_GUN_SIDE = 5;
const MAX_SHOTS_AMOUNT = 50;
const RELOAD_TIME = 2000;

const MAX_HITPOINTS = 100;
const RELOAD_PADDING = 40;
const RELOAD_SIZE = 80;
const HP_PADDING = 25;
const HP_SIZE = 120;
const AMMUNITION_SIZE = 40;
const HITBOX = 28;

const CROSSHAIR_LINE_LEN = 15;
const CROSSHAIR_LINE_WIDTH = 6;
const CROSSHAIR_DOT_RADIUS = 2;
const CROSSHAIR_HIT_DURATION = 150;
const CROSSHAIR_HIT_SIZE = 15;
const CROSSHAIR_HIT_OFFSET = 10;
const CROSSHAIR_HIT_WIDTH = 6;
const SPREAD_COOF_UI = 2;

const FPS = 60;
const BASE_HEIGHT = 1080;

const POISON_SPOT_LIFE_TIME = 5000;


export class Player extends Character {
    constructor(map, input, playerClass) {
        const spawn = map.findFreeSpawn(CONFIG.PLAYER_SYMBOL, null);
        const spawnIndex = map.playerSpawns.indexOf(spawn);
        super(spawn, PLAYER_WIDTH, PLAYER_HEIGHT, spawnIndex, null);

        this.input = input;
        this.map = map;
        this.playerClass = playerClass || { className: CONFIG.SOLDIER_CLASS_NAME };

        this.bullets = [];
        this.shotsFired = 0;
        this.lastShootTime = performance.now();

        this.speed = SPEED;
        this.damage = DAMAGE;
        this.maxShotsAmount = MAX_SHOTS_AMOUNT;
        this.shotsAmount = this.maxShotsAmount;
        this.shotCooldown = SHOOT_COOLDOWN_MS;
        this.shotOffsetForward = DIFF_GUN_FORWARD;
        this.shotOffsetSide = DIFF_GUN_SIDE;
        this.bulletSpeed = BULLET_SPEED;

        this.bulletDrawW = BULLET_WIDTH;
        this.bulletDrawH = BULLET_HEIGHT;
        this.bulletPhysW = BULLET_REAL_WIDTH;
        this.bulletPhysH = BULLET_REAL_HEIGHT;

        this.isReloading = false;
        this.reloadStartTime = undefined;

        this.hpCanvas = document.createElement('canvas');
        this.hpCanvas.width = HP_SIZE;
        this.hpCanvas.height = HP_SIZE;
        this.hpCtx = this.hpCanvas.getContext('2d');

        this.appliedDamage = 0;
        this.kills = 0;
        this.bulletsToRemove = [];

        this.isMultiplayer = false;
        this.hitpoints = MAX_HITPOINTS;
        this.visualSpread = BASE_SPREAD;
        this.lastHitTime = 0;
        this.remoteEnemies = [];
        this.team = 'none';
    }

    update(map, canvas, zoom, enemies, targets, dt) {
        if (!this.isAlive) return;

        const timeScale = (dt || 0.0166) * FPS;
        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;

        const worldMouseX = (this.input.mouseX - canvas.width / 2) / zoom + centerX;
        const worldMouseY = (this.input.mouseY - canvas.height / 2) / zoom + centerY;

        this.angle = Math.atan2(worldMouseY - centerY, worldMouseX - centerX);

        this.move(map, enemies, targets, timeScale);

        if (this.playerClass.attackType === CONFIG.SHOOT_ATTACK_TYPE || !this.playerClass.attackType) {
            this.shoot(worldMouseX, worldMouseY);
        }

        if (
            this.input.isJustPressed('KeyR') && 
            !this.isReloading && 
            this.shotsAmount < this.maxShotsAmount && 
            this.playerClass.className != CONFIG.SCIENTIST_CLASS_NAME
        ) {
            this.isReloading = true;
            this.playReloadSound();
        }

        if (this.isShooting && this.shotsFired > 1) {
            this.visualSpread += (MAX_SPREAD - this.visualSpread) * Math.min(1, 0.3 * timeScale);
        } else {
            this.visualSpread += (BASE_SPREAD - this.visualSpread) * Math.min(1, 0.15 * timeScale);
        }

        this.handleBullets(map, enemies, targets, timeScale);
        this.removeBullets();
        this.handlePoisonSpots(map, enemies, targets);
    }

    handlePoisonSpots(map, enemies, targets) {
        const current = performance.now();
        this.spotManager.poisonSpots = this.spotManager.poisonSpots.filter(
            spot => current - spot.spawnTime < POISON_SPOT_LIFE_TIME
        );

        const poisonSpots = this.spotManager.poisonSpots;

        poisonSpots.forEach(poisonSpot => {
            enemies.forEach((enemy) => {
                if (enemy.isAlive) {
                    const entityRect = {x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h};
                    const poisonRect = {x: poisonSpot.x, y: poisonSpot.y, w: poisonSpot.size, h: poisonSpot.size}
                    if (this.map.isIntersecting(poisonRect, entityRect)) {
                            this.appliedDamage += this.poisonDamage;
                            enemy.takeDamage(this.poisonDamage, this.map, CONFIG.ENEMY_SYMBOLks);
                        if (this.hitPlayerSound) {
                            this.hitPlayerSound.stop();
                            this.hitPlayerSound.play();
                        }
                    }
                }
            });
            targets.forEach((target) => {
                if (target.isAlive) {
                    const entityRect = {x: target.x, y: target.y, w: target.w, h: target.h};
                    const poisonRect = {x: poisonSpot.x, y: poisonSpot.y, w: poisonSpot.size, h: poisonSpot.size}
                    if (this.map.isIntersecting(poisonRect, entityRect)) {
                            this.appliedDamage += this.poisonDamage;
                            target.takeDamage(this.poisonDamage, this.map, CONFIG.TARGET_SYMBOL);
                        if (this.hitPlayerSound) {
                            this.hitPlayerSound.stop();
                            this.hitPlayerSound.play();
                        }
                    }
                }
            });
        });
    }

    move(map, enemies, targets, timeScale) {
        let nextX = this.x;
        let nextY = this.y;
        let dx = 0;
        let dy = 0;

        if (this.input.isPressed('KeyW') || this.input.isPressed('ArrowUp')) dx -= 0, dy -= 1;
        if (this.input.isPressed('KeyS') || this.input.isPressed('ArrowDown')) dx -= 0, dy += 1;
        if (this.input.isPressed('KeyA') || this.input.isPressed('ArrowLeft')) dx -= 1, dy -= 0;
        if (this.input.isPressed('KeyD') || this.input.isPressed('ArrowRight')) dx += 1, dy -= 0;

        if (dx !== 0 || dy !== 0) {
            if (this.stepsSound) this.stepsSound.play();
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;

            nextX += dx * this.speed * timeScale;
            nextY += dy * this.speed * timeScale;
        } else {
            if (this.stepsSound) this.stepsSound.stop();
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
        const now = performance.now();

        if (now - this.lastShootTime >= SPREAD_RECOVERY_TIME_MS) {
            this.shotsFired = 0;
        }

        if (this.input.isMouseDown) {
            if (
                now - this.lastShootTime >= this.shotCooldown && 
                (this.shotsAmount > 0 || this.playerClass.className == CONFIG.SCIENTIST_CLASS_NAME) &&
                !this.isReloading
            ) {
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

    playReloadSound() {
        if (this.reloadSound) {
            this.reloadSound.play();
        }
    }

    createBullet(targetX, targetY) {
        this.shotsAmount--;
        this.shotsFired++;

        if (this.shootSounds) {
            this.playFrequentSound(this.shootSounds);
        }

        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;

        let spawnX = centerX + Math.cos(this.angle) * this.shotOffsetForward;
        let spawnY = centerY + Math.sin(this.angle) * this.shotOffsetForward;

        spawnX += Math.cos(this.angle + Math.PI / 2) * this.shotOffsetSide;
        spawnY += Math.sin(this.angle + Math.PI / 2) * this.shotOffsetSide;

        let finalAngle = this.angle;

        if (this.shotsFired > 1) {
            const spreadMultiplier = Math.min(1.0, (this.shotsFired - 1) / 5.0);
            const baseSpread = (Math.random() - 0.5) / SPREAD_FACTOR;
            finalAngle += baseSpread * spreadMultiplier;
        }

        const directionX = Math.cos(finalAngle);
        const directionY = Math.sin(finalAngle);

        this.bullets.push({
            x: spawnX,
            y: spawnY,
            xDirection: directionX,
            yDirection: directionY,
            bulletSpeed: this.bulletSpeed,
            offset: 0
        });
    }

    handleBullets(map, enemies, targets, timeScale) {
        this.bulletsToRemove = [];

        this.bullets.forEach((bullet, index) => {
            const isHit = this.processBulletPhysics(bullet, enemies, targets, timeScale, index);
            if (isHit && !this.bulletsToRemove.includes(index)) {
                if (this.playerClass.className == CONFIG.SCIENTIST_CLASS_NAME) {
                    this.spotManager.addPoisonSpot(bullet.x, bullet.y);
                }
                
                if (!this.bulletsToRemove.includes(index)) {
                    this.bulletsToRemove.push(index);
                }
            }
        });
    }

    processBulletPhysics(bullet, enemies, targets, timeScale, bulletIndex) {
        const actualSpeed = bullet.bulletSpeed * timeScale;
        const steps = Math.max(1, Math.ceil(actualSpeed / 10));
        const stepX = (bullet.xDirection * actualSpeed) / steps;
        const stepY = (bullet.yDirection * actualSpeed) / steps;

        for (let s = 0; s < steps; s++) {
            bullet.x += stepX;
            bullet.y += stepY;

            const bulletRect = {
                x: bullet.x - this.bulletPhysW / 2,
                y: bullet.y - this.bulletPhysH / 2,
                w: this.bulletPhysW,
                h: this.bulletPhysH
            };

            const isHit = this.handleBulletsIntersecting(enemies, targets, bulletRect, bulletIndex);

            if (isHit) {
                return true;
            }

            if (this.remoteEnemies && this.checkEntityCollision(bulletRect, this.remoteEnemies, null)) {
                return true;
            }

            if (this.map.checkCollision(bulletRect)) {
                this.playHitHardSounds(bulletRect);
                return true;
            }
        }
        return false;
    }

    playHitHardSounds(bulletRect) {
        if (this.hitHardSounds) {
            this.playFrequentSound(this.hitHardSounds);
        }
    }

    removeBullets() {
        this.bulletsToRemove.sort((a, b) => b - a);
        for (let i = 0; i < this.bulletsToRemove.length; i++) {
            this.bullets.splice(this.bulletsToRemove[i], 1);
        }
        this.bulletsToRemove = [];
    }

    handleBulletsIntersecting(enemies, targets, bulletRect) {
        let hasHit = false;

        enemies.forEach((enemy) => {
            if (enemy.isAlive) {
                const entityRect = {x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h};
                if (this.map.isIntersecting(bulletRect, entityRect)) {
                    if (!this.isMultiplayer) {
                        this.appliedDamage += this.damage;
                        enemy.takeDamage(this.damage, this.map, CONFIG.ENEMY_SYMBOL);
                    }
                    if (this.hitPlayerSound) {
                        this.hitPlayerSound.stop();
                        this.hitPlayerSound.play();
                    }
                    this.lastHitTime = performance.now();
                    hasHit = true;
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
                    if (this.hitPlayerSound) {
                        this.hitPlayerSound.stop();
                        this.hitPlayerSound.play();
                    }
                    this.lastHitTime = performance.now();
                    hasHit = true;
                }
            }
        });

        return hasHit;
    }

    checkEntityCollision(bulletRect, entities, symbol) {
        if (!entities) return false;
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            if (!entity.isAlive || (entity.hitpoints !== undefined && entity.hitpoints <= 0)) continue;
            const entityRect = {x: entity.x, y: entity.y, w: entity.w, h: entity.h};

            if (this.map.isIntersecting(bulletRect, entityRect)) {
                if (!this.isMultiplayer) {
                    this.appliedDamage += this.damage;
                    entity.takeDamage(this.damage, this.map, symbol);
                }
                if (this.hitPlayerSound) {
                    this.hitPlayerSound.stop();
                    this.hitPlayerSound.play();
                }
                this.lastHitTime = performance.now();
                return true;
            }
        }
        return false;
    }

    drawBullets(ctx, bulletImg) {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffaa00';

        this.bullets.forEach(bullet => {
            ctx.save();
            ctx.translate(bullet.x, bullet.y);
            const angle = Math.atan2(bullet.yDirection, bullet.xDirection) + Math.PI / 2;
            ctx.rotate(angle);

            if (this.playerClass.className == CONFIG.SCIENTIST_CLASS_NAME) {
                bullet.bulletRotation += this.bulletRotationSpeed;
                ctx.rotate(bullet.bulletRotation);
            }

            ctx.drawImage(bulletImg, -this.bulletDrawW / 2, -this.bulletDrawH / 2, this.bulletDrawW, this.bulletDrawH);
            ctx.restore();
        });
        ctx.restore();
    }

    getAmmoText() {
        return this.shotsAmount;
    }

    drawReloadInterface(ctx, reloadImg, canvas) {
        if (this.playerClass.className == CONFIG.SCIENTIST_CLASS_NAME) return;

        const uiScale = canvas.height / BASE_HEIGHT;
        const scaledSize = Math.floor(RELOAD_SIZE * uiScale);
        const scaledPadding = Math.floor(RELOAD_PADDING * uiScale);
        const scaledFontSize = Math.floor(AMMUNITION_SIZE * uiScale);

        ctx.save();

        const imgX = canvas.width - scaledPadding - scaledSize;
        const imgY = canvas.height - scaledPadding - scaledSize;

        ctx.drawImage(reloadImg, imgX, imgY, scaledSize, scaledSize);

        ctx.fillStyle = 'white';
        ctx.font = `bold ${scaledFontSize}px Arial`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        const text = this.getAmmoText(); // Вызываем метод

        const textX = imgX - (15 * uiScale);
        const textY = imgY + (scaledSize / 2) + (3 * uiScale);

        ctx.fillText(text, textX, textY);

        ctx.restore();
    }

    drawHPInterface(ctx, hearthImg, canvas) {
        const uiScale = canvas.height / BASE_HEIGHT;
        const scaledHpSize = Math.floor(HP_SIZE * uiScale);
        const scaledHpPadding = Math.floor(HP_PADDING * uiScale);

        if (this.hpCanvas.width !== scaledHpSize) {
            this.hpCanvas.width = scaledHpSize;
            this.hpCanvas.height = scaledHpSize;
        }

        this.hpCtx.clearRect(0, 0, scaledHpSize, scaledHpSize);
        this.hpCtx.drawImage(hearthImg, 0, 0, scaledHpSize, scaledHpSize);

        this.hpCtx.globalCompositeOperation = 'source-in';

        const percent = Math.max(0, this.hitpoints / MAX_HITPOINTS);
        const height = scaledHpSize * percent;

        this.hpCtx.fillStyle = '#ff0000';
        this.hpCtx.fillRect(0, scaledHpSize - height, scaledHpSize, height);
        this.hpCtx.globalCompositeOperation = 'source-over';

        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.drawImage(hearthImg, scaledHpPadding, canvas.height - scaledHpSize - scaledHpPadding, scaledHpSize, scaledHpSize);
        ctx.restore();

        ctx.drawImage(this.hpCanvas, scaledHpPadding, canvas.height - scaledHpSize - scaledHpPadding);
    }

    drawCrosshair(ctx, canvas, isPaused) {
        if (!this.isAlive || isPaused) {
            canvas.style.cursor = 'default';
            if (!this.isAlive) return;
        } else {
            canvas.style.cursor = 'none';
        }

        if (isPaused) return;

        const mouseX = this.input.mouseX;
        const mouseY = this.input.mouseY;

        const uiScale = canvas.height / BASE_HEIGHT;

        const spread = this.visualSpread * uiScale * SPREAD_COOF_UI;
        const lineLen = CROSSHAIR_LINE_LEN * uiScale;
        const lineWidth = Math.max(1, CROSSHAIR_LINE_WIDTH * uiScale);
        const dotRadius = Math.max(1, CROSSHAIR_DOT_RADIUS * uiScale);

        ctx.save();
        ctx.translate(mouseX, mouseY);

        ctx.strokeStyle = 'rgb(255 0 0 / 0.9)';
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';

        ctx.beginPath();

        ctx.moveTo(0, -spread);
        ctx.lineTo(0, -spread - lineLen);
        ctx.moveTo(0, spread);
        ctx.lineTo(0, spread + lineLen);

        ctx.moveTo(-spread, 0);
        ctx.lineTo(-spread - lineLen, 0);
        ctx.moveTo(spread, 0);
        ctx.lineTo(spread + lineLen, 0);

        ctx.stroke();

        ctx.fillStyle = 'rgb(255 0 0 / 0.9)';
        ctx.beginPath();
        ctx.arc(0, 0, dotRadius, 0, Math.PI * 2);
        ctx.fill();

        if (this.lastHitTime) {
            const now = performance.now();
            const timeSinceHit = now - this.lastHitTime;
            const hitDuration = CROSSHAIR_HIT_DURATION;

            if (timeSinceHit < hitDuration) {
                const alpha = 1 - (timeSinceHit / hitDuration);
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.lineWidth = CROSSHAIR_HIT_WIDTH;

                const hitSize = CROSSHAIR_HIT_SIZE * uiScale;
                const offset = spread + (CROSSHAIR_HIT_OFFSET * uiScale);

                ctx.beginPath();

                ctx.moveTo(-offset, -offset);
                ctx.lineTo(-offset - hitSize, -offset - hitSize);
                ctx.moveTo(offset, -offset);
                ctx.lineTo(offset + hitSize, -offset - hitSize);
                ctx.moveTo(-offset, offset);
                ctx.lineTo(-offset - hitSize, offset + hitSize);
                ctx.moveTo(offset, offset);
                ctx.lineTo(offset + hitSize, offset + hitSize);
                ctx.stroke();
            }
        }
        ctx.restore();
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
            this.shotsAmount = this.maxShotsAmount;
            this.isReloading = false;
            this.reloadStartTime = undefined;
        }
    }
}