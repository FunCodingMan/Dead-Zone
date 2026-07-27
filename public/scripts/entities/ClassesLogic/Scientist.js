import { Player } from "../Player.js";

const BULLET_DISTANCE = 200;

export class Scientist extends Player {
    constructor(map, input, playerClass) {
        super(map, input, playerClass);
    }

    createBulletScientist(directionX, directionY, spawnX, spawnY, angle, owner, bullets) {  
        // this.playFrequentSound(this.flameSounds);

        bullets.push(
            {
                x: spawnX, y: spawnY,
                xDirection: directionX,
                yDirection: directionY,
                bulletSpeed: this.bulletSpeed,
                offset: 0,
                owner: owner,
                bulletWidth: this.bulletWidth,
                bulletHeight: this.bulletHeight,
                bulletRotation: this.bulletRotation
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