import { CONFIG } from '../core/Config.js';
import { Character } from './Character.js';
import {Sound} from "../core/Sound.js";

const PLAYER_WIDTH = 28;
const PLAYER_HEIGHT = 48;
const SPEED = 4;

const BULLET_SPEED = 55;
const BULLET_WIDTH = 3;
const BULLET_HEIGHT = 45;

const BULLET_REAL_WIDTH = 4;
const BULLET_REAL_HEIGHT = 4;

const BASE_SPREAD = 5;
const MAX_SPREAD = 22;
const SPREAD_FACTOR = 10;
const SPREAD_RECOVERY_TIME_MS = 400;
const SHOOT_COOLDOWN_MS = 150;
const DAMAGE = 40;
const DIFF_GUN_FORWARD = 1;
const DIFF_GUN_SIDE = 5;
const MAX_SHOTS_AMOUNT = 50;
const RELOAD_TIME = 2000;

const MAX_HITPOINTS = 100;
const RELOAD_PADDING = 40;
const RELOAD_SIZE = 80;
const HP_PADDING = 25;
const HP_SIZE = 120;
const RELOAD_TEXT_PADDING = 20;
const RELOAD_TEXT_SIZE = 10;
const HITBOX = 28;

const CROSSHAIR_LINE_LEN = 8;
const CROSSHAIR_HIT_DURATION = 150;
const CROSSHAIR_HIT_SIZE = 8;
const CROSSHAIR_HIT_OFFSET = 4;

const FPS = 60;

const BASE_HEIGHT = 1080;
const AMMUNITION_SIZE = 40;

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

        this.visualSpread = 5;
        this.lastHitTime = 0;
        this.remoteEnemies = [];
    }

    update(map, canvas, zoom, enemies, targets, dt) {
        if (!this.isAlive) return;
        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;

        const timeScale = (dt || 0.0166) * FPS;

        const worldMouseX = (this.input.mouseX - canvas.width / 2) / zoom + centerX;
        const worldMouseY = (this.input.mouseY - canvas.height / 2) / zoom + centerY;

        this.angle = Math.atan2(worldMouseY - centerY, worldMouseX - centerX);

        this.move(map, enemies, targets, timeScale);
        this.shoot(worldMouseX, worldMouseY);

        if (this.input.isJustPressed('KeyR') && !this.isReloading && this.shotsAmount < MAX_SHOTS_AMOUNT) {
            this.isReloading = true;
            this.reloadSound.play();
        }

        if (this.isShooting && this.shotsFired > 1) {
            this.visualSpread += (MAX_SPREAD - this.visualSpread) * Math.min(1, 0.3 * timeScale);
        } else {
            this.visualSpread += (BASE_SPREAD - this.visualSpread) * Math.min(1, 0.15 * timeScale);
        }

        this.handleBullets(map, enemies, targets, timeScale);
    }

    move(map, enemies, targets, timeScale) {
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

            nextX += dx * this.speed * timeScale;
            nextY += dy * this.speed * timeScale;
        } else {
            this.stepsSound.stop();
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
            const now = performance.now();
            if (now - this.lastShootTime >= SHOOT_COOLDOWN_MS && this.shotsAmount > 0 && !this.isReloading) {
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

    createBullet() {
        this.shotsAmount--;

        this.playFrequentSound(this.shootSounds);

        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;

        let spawnX = centerX + Math.cos(this.angle) * DIFF_GUN_FORWARD;
        let spawnY = centerY + Math.sin(this.angle) * DIFF_GUN_FORWARD;

        spawnX += Math.cos(this.angle + Math.PI / 2) * DIFF_GUN_SIDE;
        spawnY += Math.sin(this.angle + Math.PI / 2) * DIFF_GUN_SIDE;

        this.shotsFired++;

        let finalAngle = this.angle;

        if (this.shotsFired > 1) {
            const spreadMultiplier = Math.min(1.0, (this.shotsFired - 1) / 5.0);
            const baseSpread = (Math.random() - 0.5) / SPREAD_FACTOR;

            finalAngle += baseSpread * spreadMultiplier;
        }

        let directionX = Math.cos(finalAngle);
        let directionY = Math.sin(finalAngle);

        this.bullets.push({
            x: spawnX,
            y: spawnY,
            xDirection: directionX,
            yDirection: directionY,
            bulletSpeed: BULLET_SPEED
        });
    }

    handleBullets(map, enemies, targets, timeScale) {
        const toRemove = [];

        for (let i = 0; i < this.bullets.length; i++) {
            const isHit = this.processBulletPhysics(this.bullets[i], enemies, targets, timeScale);
            if (isHit) {
                toRemove.push(i);
            }
        }

        for (let i = toRemove.length - 1; i >= 0; i--) {
            this.bullets.splice(toRemove[i], 1);
        }
    }

    processBulletPhysics(bullet, enemies, targets, timeScale) {
        const actualSpeed = bullet.bulletSpeed * timeScale;

        const steps = Math.max(1, Math.ceil(actualSpeed / 10));
        const stepX = (bullet.xDirection * actualSpeed) / steps;
        const stepY = (bullet.yDirection * actualSpeed) / steps;

        for (let s = 0; s < steps; s++) {
            bullet.x += stepX;
            bullet.y += stepY;

            const bulletRect = {
                x: bullet.x - BULLET_REAL_WIDTH / 2,
                y: bullet.y - BULLET_REAL_HEIGHT / 2,
                w: BULLET_REAL_WIDTH,
                h: BULLET_REAL_HEIGHT
            };

            if (this.checkEntityCollision(bulletRect, enemies, CONFIG.ENEMY_SYMBOL)) return true;
            if (this.checkEntityCollision(bulletRect, targets, CONFIG.TARGET_SYMBOL)) return true;
            if (this.remoteEnemies && this.checkEntityCollision(bulletRect, this.remoteEnemies, null)) return true;
            if (this.map.checkCollision(bulletRect)) {
                this.playFrequentSound(this.hitHardSounds);
                return true;
            }
        }

        return false;
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
            ctx.drawImage(bulletImg, -BULLET_WIDTH / 2, -BULLET_HEIGHT / 2, BULLET_WIDTH, BULLET_HEIGHT);
            ctx.restore();
        });
        ctx.restore();
    }

    drawReloadInterface(ctx, reloadImg, canvas) {
        const uiScale = canvas.height / BASE_HEIGHT;
        const reloadSize = Math.floor(RELOAD_SIZE * uiScale);
        const reloadPadding = Math.floor(RELOAD_PADDING * uiScale);
        const fontSize = Math.floor(AMMUNITION_SIZE * uiScale);
        ctx.save();
        ctx.drawImage(
            reloadImg,
            canvas.width - reloadPadding - reloadSize,
            canvas.height - reloadPadding - reloadSize,
            reloadSize, reloadSize
        );
        ctx.fillStyle = 'white';
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        ctx.fillText(
            this.shotsAmount,
            canvas.width - reloadPadding - reloadSize - (15 * uiScale),
            canvas.height - reloadPadding - (reloadSize / 2) + (3 * uiScale)
        );
        ctx.restore();
    }

    drawHPInterface(ctx, hearthImg, canvas) {
        const uiScale = canvas.height / BASE_HEIGHT;
        const hpSize = Math.floor(HP_SIZE * uiScale);
        const hpPadding = Math.floor(HP_PADDING * uiScale);

        if (this.hpCanvas.width !== hpSize) {
            this.hpCanvas.width = hpSize;
            this.hpCanvas.height = hpSize;
        }


        this.hpCtx.clearRect(0, 0, hpSize, hpSize);
        this.hpCtx.drawImage(hearthImg, 0, 0, hpSize, hpSize);

        this.hpCtx.globalCompositeOperation = 'source-in';

        const percent = Math.max(0, this.hitpoints / MAX_HITPOINTS);
        const height = hpSize * percent;

        this.hpCtx.fillStyle = '#ff0000';
        this.hpCtx.fillRect(0, hpSize - height, hpSize, height);
        this.hpCtx.globalCompositeOperation = 'source-over';

        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.drawImage(hearthImg, hpPadding, canvas.height - hpSize - hpPadding, hpSize, hpSize);
        ctx.restore();

        ctx.drawImage(this.hpCanvas, hpPadding, canvas.height - hpSize - hpPadding);
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

        const spread = this.visualSpread * uiScale;
        const lineLen = CROSSHAIR_LINE_LEN * uiScale;
        const lineWidth = Math.max(1, 2 * uiScale);
        const dotRadius = Math.max(1, 1.5 * uiScale);

        ctx.save();
        ctx.translate(mouseX, mouseY);

        ctx.strokeStyle = 'rgba(0, 255, 100, 0.9)';
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

        ctx.fillStyle = 'rgba(0, 255, 100, 0.9)';
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
                ctx.lineWidth = 2;

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
            this.shotsAmount = MAX_SHOTS_AMOUNT;
            this.isReloading = false;
            this.reloadStartTime = undefined;
        }
    }


}