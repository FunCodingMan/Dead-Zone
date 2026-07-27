import { CONFIG } from "../core/Config.js";
import {Character} from "./Character.js";

const TURRET_SIZE = 48;
const HITPOINTS = 100;
const SHOOT_COOLDOWN = 500;
const BULLET_SPEED = 5;
const BULLET_WIDTH = 10;
const BULLET_HEIGHT = 15;
const BULLET_DAMAGE = 7;

const BULLET_OFFSET = 5;

export class Turret extends Character{
    constructor(map, playerPosition) {
        const spawn = map.findFreeSpawn(CONFIG.TURRET_SYMBOL, playerPosition, TURRET_SIZE, TURRET_SIZE);
        const spawnIndex = map.turretSpawns.indexOf(spawn);
        super(spawn, TURRET_SIZE, TURRET_SIZE, spawnIndex, null, HITPOINTS);
        this.map = map;
        this.hitpoints = HITPOINTS;
        this.lastShotTime = 0;
        this.bulletSpeed = BULLET_SPEED;
    }

    getVector(x, y) {
        return Math.sqrt(x * x + y * y);
    }

    throwRaycast(player) {
        const startX = this.x + this.w / 2;
        const startY = this.y + this.h / 2;

        const endX = player.x + player.w / 2;
        const endY = player.y + player.h / 2;

        const dx = endX - startX;
        const dy = endY - startY;

        const distance = this.getVector(dx, dy);

        const step = 4;
        const dirX = dx / distance;
        const dirY = dy / distance;

        for (let d = 0; d < distance; d += step) {
            const x = startX + dirX * d;
            const y = startY + dirY * d;

            const point = {x: x, y: y, w: 1, h: 1};

            if (this.map.checkCollision(point)) {
                return false;
            }
        }

        return true;
    }

    manageTurretBullets(player) {
        const current = performance.now();

        if (current - this.lastShotTime > SHOOT_COOLDOWN && this.throwRaycast(player)) {
            this.lastShotTime = current;

            const targetX = player.x + player.w / 2;
            const targetY = player.y + player.h / 2;

            this.bulletWidth = BULLET_WIDTH;
            this.bulletHeight = BULLET_HEIGHT;
            this.damage = BULLET_DAMAGE;


            this.createBullet(targetX, targetY, CONFIG.TURRET_SYMBOL, this.bullets);
        }

        this.handleBullets(this.map, [], [], [], this, this.bullets, player);
        this.removeBullets(this.bullets);

        this.handleBullets(this.map, [], [], [], this, this.bullets, player);
        this.removeBullets(this.bullets);

        console.log(this.bullets);
    }

    createBulletTurret(directionX, directionY, spawnX, spawnY, owner, bullets) {
        const perpX = -directionY;
        const perpY = directionX;

        bullets.push({
            x: spawnX + perpX * BULLET_OFFSET,
            y: spawnY + perpY * BULLET_OFFSET,
            xDirection: directionX,
            yDirection: directionY,
            bulletSpeed: this.bulletSpeed,
            offset: 0,
            owner: owner,
            bulletWidth: this.bulletWidth,
            bulletHeight: this.bulletHeight
        });

        bullets.push({
            x: spawnX - perpX * BULLET_OFFSET,
            y: spawnY - perpY * BULLET_OFFSET,
            xDirection: directionX,
            yDirection: directionY,
            bulletSpeed: this.bulletSpeed,
            offset: 0,
            owner: owner,
            bulletWidth: this.bulletWidth,
            bulletHeight: this.bulletHeight
        });
    }
}