import { Player } from "../Player.js";

const SPREAD = 0.15;
const BULLET_DISTANCE = 200;

export class Flamethrower extends Player {
    constructor(map, input, playerClass) {
        super(map, input, playerClass);
    }

    rotateVector(x, y, angle) {
        return {
            x: x * Math.cos(angle) - y * Math.sin(angle),
            y: x * Math.sin(angle) + y * Math.cos(angle)
        };
    }

    createBulletFlamethrower(directionX, directionY, spawnX, spawnY, angle) {
        this.shotsAmount -= 5;
        
        this.playFrequentSound(this.flameSounds);

        const center = { x: directionX, y: directionY };
        const left = this.rotateVector(directionX, directionY, -SPREAD * Math.random());
        const right = this.rotateVector(directionX, directionY, SPREAD * Math.random());
        const farLeft = this.rotateVector(directionX, directionY, -SPREAD * 1.5 * Math.random());
        const farRight = this.rotateVector(directionX, directionY, SPREAD * 1.5 * Math.random());

        this.bullets.push(
            {
                x: spawnX,
                y: spawnY,
                xDirection: center.x,
                yDirection: center.y,
                bulletSpeed: this.bulletSpeed,
                offset: 0
            },
            {
                x: spawnX,
                y: spawnY,
                xDirection: left.x,
                yDirection: left.y,
                bulletSpeed: this.bulletSpeed,
                offset: 0
            },
            {
                x: spawnX,
                y: spawnY,
                xDirection: right.x,
                yDirection: right.y,
                bulletSpeed: this.bulletSpeed,
                offset: 0
            },
            {
                x: spawnX,
                y: spawnY,
                xDirection: farLeft.x,
                yDirection: farLeft.y,
                bulletSpeed: this.bulletSpeed,
                offset: 0
            },
            {
                x: spawnX,
                y: spawnY,
                xDirection: farRight.x,
                yDirection: farRight.y,
                bulletSpeed: this.bulletSpeed,
                offset: 0
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