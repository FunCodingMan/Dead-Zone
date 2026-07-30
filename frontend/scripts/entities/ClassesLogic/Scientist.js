import { CONFIG } from "../../core/Config.js";
import { Player } from "../Player.js";

const BULLET_DISTANCE = 200;

export class Scientist extends Player {
    constructor(map, input, playerClass) {
        super(map, input, playerClass);

        this.speed = 4;
        this.damage = 10;
        this.poisonDamage = 5;

        this.maxShotsAmount = Infinity;
        this.shotsAmount = Infinity;

        this.shotCooldown = 500;

        this.shotOffsetForward = 12;
        this.shotOffsetSide = 3;

        this.bulletSpeed = 5;

        this.bulletWidth = 30;
        this.bulletHeight = 30;

        this.bulletDrawW = 30;
        this.bulletDrawH = 30;

        this.bulletPhysW = 30;
        this.bulletPhysH = 30;

        this.bulletRotationSpeed = 0.1;
    }
    createBullet(targetX, targetY) {  
        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;

        let spawnX = centerX + Math.cos(this.angle) * this.shotOffsetForward;
        let spawnY = centerY + Math.sin(this.angle) * this.shotOffsetForward;

        spawnX += Math.cos(this.angle + Math.PI / 2) * this.shotOffsetSide;
        spawnY += Math.sin(this.angle + Math.PI / 2) * this.shotOffsetSide;

        const dirX = Math.cos(this.angle);
        const dirY = Math.sin(this.angle);

        this.bullets.push(
            {
                x: spawnX, 
                y: spawnY,
                xDirection: dirX,
                yDirection: dirY,
                bulletSpeed: this.bulletSpeed,
                offset: 0,
                bulletWidth: this.bulletWidth,
                bulletHeight: this.bulletHeight,
                bulletRotation: 0,
                owner: CONFIG.PLAYER_SYMBOL,
                width: this.bulletDrawW,
                height: this.bulletDrawH,
                physWidth: this.bulletPhysW,
                physHeight: this.bulletPhysH,
                damage: this.damage    
            }
        );
    }

    countOffset(bullet, index) {
        const dVector = this.countVector(bullet.xDirection * bullet.bulletSpeed, bullet.yDirection * bullet.bulletSpeed);
        bullet.offset += dVector;

        if (bullet.offset > (BULLET_DISTANCE)) {
            this.bulletsToRemove.push(index);
        }
    }

    countVector(x, y) {
        return Math.sqrt(x * x + y * y);
    }
}