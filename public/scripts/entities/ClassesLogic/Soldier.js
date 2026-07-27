import { Player } from "../Player.js";

export class Soldier extends Player {
    constructor(map, input, playerClass) {
        super(map, input, playerClass);
    }

    createBulletSoldier(directionX, directionY, spawnX, spawnY) {
        this.bullets.push({
            x: spawnX,
            y: spawnY,
            xDirection: directionX,
            yDirection: directionY,
            bulletSpeed: this.bulletSpeed,
            offset: 0
        });
    }

    playHitHardSounds(bulletRect) {
        this.map.walls.forEach(wall => {
            if (this.map.isIntersecting(bulletRect, wall)) {
                if (this.hitHardSounds) this.playFrequentSound(this.hitHardSounds);
            }
        });

        this.map.boxes.forEach(box => {
            if (this.map.isIntersecting(bulletRect, box)) {
                if (this.hitHardSounds) this.playFrequentSound(this.hitHardSounds);
            }
        });
    }
}