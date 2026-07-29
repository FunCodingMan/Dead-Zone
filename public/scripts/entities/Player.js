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
const SPREAD_RECOVERY_TIME_MS = 400;
const SHOOT_COOLDOWN_MS = 150;
const DAMAGE = 50;
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
    constructor(map, input, playerClass, spotManager) {
        const spawn = map.findFreeSpawn(CONFIG.PLAYER_SYMBOL, null);
        const spawnIndex = map.playerSpawns.indexOf(spawn);
        super(spawn, PLAYER_WIDTH, PLAYER_HEIGHT, spawnIndex, null);

        this.input = input;
        this.map = map;
        this.playerClass = playerClass || { className: CONFIG.SOLDIER_CLASS_NAME };

        this.speed = SPEED;

        this.isReloading = false;
        this.reloadStartTime = undefined;

        this.hpCanvas = document.createElement('canvas');
        this.hpCanvas.width = HP_SIZE;
        this.hpCanvas.height = HP_SIZE;
        this.hpCtx = this.hpCanvas.getContext('2d');

        this.appliedDamage = 0;
        this.kills = 0;

        this.isMultiplayer = false;
        this.hitpoints = MAX_HITPOINTS;
        this.visualSpread = BASE_SPREAD;
        this.lastHitTime = 0;
        this.remoteEnemies = [];
        this.team = 'none';

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

        this.canShoot = true;
    }

    update(map, canvas, zoom, enemies, targets, boss, dt) {
        if (!this.isAlive) return;

        const timeScale = (dt || 0.0166) * FPS;
        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;

        const worldMouseX = (this.input.mouseX - canvas.width / 2) / zoom + centerX;
        const worldMouseY = (this.input.mouseY - canvas.height / 2) / zoom + centerY;

        this.angle = Math.atan2(worldMouseY - centerY, worldMouseX - centerX);

        this.move(map, enemies, targets, timeScale);

        if ((this.playerClass.attackType == CONFIG.SHOOT_ATTACK_TYPE || !this.playerClass.attackType) && this.canShoot) {
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

        this.handleBullets(map, enemies, targets, boss, this, timeScale);
        this.removeBullets();
        this.handlePoisonSpots(map, enemies, targets, boss);
    }

    handlePoisonSpots(map, enemies, targets, boss) {
        if (!this.spotManager) return;
        const current = performance.now();
        this.spotManager.poisonSpots = this.spotManager.poisonSpots.filter(
            spot => current - spot.spawnTime < POISON_SPOT_LIFE_TIME
        );

        const poisonSpots = this.spotManager.poisonSpots;

        poisonSpots.forEach(poisonSpot => {
            if (boss) {
                const entityRect = {x: boss.x, y: boss.y, w: boss.w, h: boss.h};
                const poisonRect = {x: poisonSpot.x, y: poisonSpot.y, w: poisonSpot.size, h: poisonSpot.size};
                if (this.map.isIntersecting(poisonRect, entityRect)) {
                    this.appliedDamage += this.poisonDamage;
                    boss.takeDamage(this.poisonDamage, this.map, CONFIG.BOSS_SYMBOL);
                    console.log(boss.hitpoints);
                }
            }

            enemies.forEach((enemy) => {
                if (enemy.isAlive) {
                    const entityRect = {x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h};
                    const poisonRect = {x: poisonSpot.x, y: poisonSpot.y, w: poisonSpot.size, h: poisonSpot.size}
                    if (this.map.isIntersecting(poisonRect, entityRect)) {
                            this.appliedDamage += this.poisonDamage;
                            enemy.takeDamage(this.poisonDamage, this.map, CONFIG.ENEMY_SYMBOL);
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
                this.createBullet(x, y, CONFIG.PLAYER_SYMBOL);
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

    onHitEntity(entity, symbol) {
        if (!this.isMultiplayer) {
            this.appliedDamage += this.damage;
            entity.takeDamage(this.damage, this.map, symbol);
        }

        if (this.hitPlayerSound) {
            this.hitPlayerSound.stop();
            this.hitPlayerSound.play();
        }

        this.lastHitTime = performance.now();
    }

    getAmmoText() {
        return this.shotsAmount;
    }

    drawNoAmmoHint(ctx, canvas, uiScale, scaledSize, scaledPadding) {
        const now = performance.now();
        let isBlinking = Math.floor(now / 400) % 2 === 0;

        if (isBlinking) {
            ctx.fillStyle = '#ff4444';
            ctx.font = `bold ${Math.floor(36 * uiScale)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('ПЕРЕЗАРЯДКА [R]', canvas.width / 2, canvas.height - scaledPadding - (scaledSize / 2));

            ctx.globalAlpha = 0.5;
        }
    }

    drawReloadInterface(ctx, reloadImg, canvas) {
        if (this.playerClass.className === CONFIG.SCIENTIST_CLASS_NAME) return;

        const uiScale = canvas.height / BASE_HEIGHT;
        const scaledSize = Math.floor(RELOAD_SIZE * uiScale);
        const scaledPadding = Math.floor(RELOAD_PADDING * uiScale);
        const scaledFontSize = Math.floor(AMMUNITION_SIZE * uiScale);

        ctx.save();

        const imgX = canvas.width - scaledPadding - scaledSize;
        const imgY = canvas.height - scaledPadding - scaledSize;

        if (this.shotsAmount <= 0 && !this.isReloading) {
            this.drawNoAmmoHint(ctx, canvas, uiScale, scaledSize, scaledPadding);
        }

        ctx.drawImage(reloadImg, imgX, imgY, scaledSize, scaledSize);

        ctx.globalAlpha = 1.0;

        ctx.fillStyle = this.shotsAmount <= 0 ? '#ff4444' : 'white';
        ctx.font = `bold ${scaledFontSize}px Arial`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        const text = this.getAmmoText();

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