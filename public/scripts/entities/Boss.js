import { CONFIG } from "../core/Config.js";
import {Character} from "./Character.js";

const BOSS_WIDTH = 200;
const BOSS_HEIGHT = 200;

const BOSS_SPAWN_WIDTH = 64;
const BOSS_SPAWN_HEIGHT = 64;

const MAX_ACTION_DURATION = 2000;
const LIGHTNING_ANIMATION_COOLDOWN = 100;

const LIGHTNING_ACTION = "lightning";
const LASER_ACTION = "laser";

const DECIMALS = 2;

const LIGHTNING_WIDTH = 30;
const LIGHNING_HEIGHT = 60;
const LIGHTNING_SPEED = 10;
const LIGHTNING_COOLDOWN = 100;
const LIGHTNING_DAMAGE = 10;
const LIGHTNING_X_OFFSET = 80;
const LIGHTNING_Y_OFFSET = 80;

const LASER_WIDTH = 20;
const LASER_HEIGHT = 20;
const LASER_SPEED = 15;
const LASER_DAMAGE = 10;
const LASER_COOLDOWN = 5;
const LASER_X_OFFSET = 80;
const LASER_Y_OFFSET = 5;

const CHANGING_FACTOR = 0.4;

const LIGHTNING_RANGE = {
    MIN: 0,
    MAX: 0.50
};

const LASER_RANGE = {
    MIN: 0.51,
    MAX: 1.00
};

export class Boss extends Character {
    constructor(map, playerPosition) {
        super(
            map.findFreeSpawn(
                CONFIG.BOSS_SYMBOL, 
                playerPosition, 
                BOSS_SPAWN_WIDTH, 
                BOSS_SPAWN_HEIGHT
            ), BOSS_WIDTH, BOSS_HEIGHT, null
        );
        this.map = map;
        this.hitpoints = CONFIG.BOSS_MAX_HITPOINTS;
        this.maxActionDuratiion = MAX_ACTION_DURATION;
        this.lightningAnimationCooldown = LIGHTNING_ANIMATION_COOLDOWN;
        this.lastLightningFrameTime = 0;
        this.lastLightningFrame = CONFIG.FIRST_LIGHTNING_ANIMATION_FRAME;
        this.bossActionFlag;
        this.lastActionTIme = 0;
        this.lastLightningShotTIme = 0;

        this.lastLaserShotTIme = 0;

        this.bulletWidth;
        this.bulletHeight;
        this.bulletSpeed;
        this.damage;

        this.isLightning = false;
        this.isLaser = false;

        this.playerStartPosInWindow;

    }

    update(player) {
        this.handleBullets(this.map, [], [], this, this.bossBulletsLightning, player);
        this.removeBullets(this.bossBulletsLightning);

        this.handleBullets(this.map, [], [], this, this.bossBulletsLaser, player);
        this.removeBullets(this.bossBulletsLaser);
    }

    isInRange(value, range) {
        return value >= range.MIN && value <= range.MAX;
    }

    selectBossAction(player) {
        const currentTime = performance.now();

        if (currentTime - this.lastActionTIme > this.maxActionDuratiion) {
            this.lastActionTIme = currentTime;

            const value = Math.random().toFixed(DECIMALS);

            this.playerStartPosInWindow = {x: player.x + player.w / 2, y: player.y + player.h / 2};

            if (this.isInRange(value, LIGHTNING_RANGE)) this.bossActionFlag = LIGHTNING_ACTION;
            if (this.isInRange(value, LASER_RANGE)) this.bossActionFlag = LASER_ACTION;
        }
    }    

    doBossAction(player) {
        this.isLightning = false;
        this.isLaser = false;

        if (this.bossActionFlag == LIGHTNING_ACTION) this.lightningAttack(player);
        if (this.bossActionFlag == LASER_ACTION) this.laserAttack();
    }

    laserAttack() {
        this.isLaser = true;
        const targetX = this.playerStartPosInWindow.x;
        const targetY = this.playerStartPosInWindow.y;
        
        const current = performance.now();

        if (current - this.lastLaserShotTIme > LASER_COOLDOWN) {
            this.lastLaserShotTIme = current;

            this.laserSound.play();

            this.bulletWidth = LASER_WIDTH;
            this.bulletHeight = LASER_HEIGHT;
            this.bulletSpeed = LASER_SPEED;
            this.damage = LASER_DAMAGE;

            this.createBullet(targetX, targetY, CONFIG.BOSS_SYMBOL, this.bossBulletsLaser);
        }
    }

    lightningAttack(player) {
        this.isLightning = true;

        const targetX = player.x + player.w / 2;
        const targetY = player.y + player.h / 2;
        
        const current = performance.now();

        if (current - this.lastLightningShotTIme > LIGHTNING_COOLDOWN) {
            this.lastLightningShotTIme = current;

            this.bulletWidth = LIGHTNING_WIDTH;
            this.bulletHeight = LIGHNING_HEIGHT;
            this.bulletSpeed = LIGHTNING_SPEED;
            this.damage = LIGHTNING_DAMAGE;

            this.createBullet(targetX, targetY, CONFIG.BOSS_SYMBOL, this.bossBulletsLightning);
        }
    }

    handlebossBulletsIntersecting(player, bulletRect, bulletIndex) {
        if (player) {
            if (player.isAlive) {
                if (this.map.isIntersecting(bulletRect, player)) {
                    player.takeDamage(this.damage, this.map, CONFIG.PLAYER_SYMBOL);
                    this.handleBulletsIntersectingCommon(bulletIndex, null);
                }
            }
        }
    }

    createBulletBoss(targetX, targetY, spawnX, spawnY, owner, bullets = []) {
        if (this.isLightning) {
            this.createLighningBullet(targetX, targetY, spawnX, spawnY, owner, bullets);
        }
        
        if (this.isLaser) {
            this.createLaserBullet(targetX, targetY, spawnX, spawnY, owner, bullets);
        }
    } 

    createLaserBullet(targetX, targetY, spawnX, spawnY, owner, bullets = []) {
        const offsets = [
            {x: -LASER_X_OFFSET, y: LASER_Y_OFFSET},
            {x: -LASER_X_OFFSET, y: -LASER_Y_OFFSET}
        ];

        const dx = targetX - spawnX;
        const dy = targetY - spawnY;

        const length = Math.sqrt(dx * dx + dy * dy);

        offsets.forEach(offset => {
            const rotatedX = offset.x * Math.cos(this.angle) - offset.y * Math.sin(this.angle);
            const rotatedY = offset.x * Math.sin(this.angle) + offset.y * Math.cos(this.angle);

            const bulletX = spawnX + rotatedX;
            const bulletY = spawnY + rotatedY;

            bullets.push({
                x: bulletX,
                y: bulletY,
                xDirection: dx / length,
                yDirection: dy / length,
                bulletSpeed: this.bulletSpeed,
                owner: CONFIG.BOSS_SYMBOL
            });
        });
    
        
    }

    createLighningBullet(targetX, targetY, spawnX, spawnY, owner, bullets = []) {
        this.playFrequentSound(this.lightningSounds);

        const offsets = [
            {x: -LIGHTNING_X_OFFSET, y: LIGHTNING_Y_OFFSET},
            {x: -LIGHTNING_X_OFFSET, y: -LIGHTNING_Y_OFFSET}
        ];

        offsets.forEach(offset => {

            const rotatedX = offset.x * Math.cos(this.angle) - offset.y * Math.sin(this.angle);
            const rotatedY = offset.x * Math.sin(this.angle) + offset.y * Math.cos(this.angle);

            const bulletX = spawnX + rotatedX;
            const bulletY = spawnY + rotatedY;

            const dx = targetX - bulletX;
            const dy = targetY - bulletY;

            const length = Math.sqrt(dx * dx + dy * dy);

            bullets.push({
                x: bulletX,
                y: bulletY,
                xDirection: dx / length,
                yDirection: dy / length,
                bulletSpeed: this.bulletSpeed,
                owner: CONFIG.BOSS_SYMBOL
            });

        });
    }
}