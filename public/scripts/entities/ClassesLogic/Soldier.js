import { Player } from "../Player.js";

const SPREAD_FACTOR = 10;

export class Soldier extends Player {
    constructor(map, input, playerClass) {
        super(map, input, playerClass);
    }

    createBulletSoldier(directionX, directionY, spawnX, spawnY, owner, bullets) {
        this.shotsAmount--;
        
        this.playFrequentSound(this.shootSounds);

        this.shotsFired++;

        if (this.shotsFired > 1) {
            directionX += (Math.random() - 0.5) / SPREAD_FACTOR;
            directionY += (Math.random() - 0.5) / SPREAD_FACTOR;
        }

        bullets.push({
            x: spawnX, 
            y: spawnY, 
            xDirection: directionX, 
            yDirection: directionY, 
            bulletSpeed: this.bulletSpeed, 
            offset: 0, 
            owner: owner
        });
    }

    playHitHardSounds(bulletRect) {
        this.map.walls.forEach(wall => {
            if (this.map.isIntersecting(bulletRect, wall)) {
                this.playFrequentSound(this.hitHardSounds);
            }
        });

        this.map.boxes.forEach(box => {
            if (this.map.isIntersecting(bulletRect, box)) {
                this.playFrequentSound(this.hitHardSounds);
            }
        });        
    }
}