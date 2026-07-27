import { Player } from "../Player.js";

const SPREAD = 0.25; // Слегка увеличили разброс для широкого конуса
const BULLET_DISTANCE = 200;

export class Flamethrower extends Player {
    constructor(map, input, playerClass) {
        super(map, input, playerClass);
        this.speed = 3;
        this.damage = 10;
        this.maxShotsAmount = 500;
        this.shotsAmount = this.maxShotsAmount;
        this.shotCooldown = 30;
        this.shotOffsetForward = 12;
        this.shotOffsetSide = 3;
        this.bulletSpeed = 20;
    }

    rotateVector(x, y, angle) {
        return {
            x: x * Math.cos(angle) - y * Math.sin(angle),
            y: x * Math.sin(angle) + y * Math.cos(angle)
        };
    }

    createBulletFlamethrower(directionX, directionY, spawnX, spawnY, angle) {
        this.shotsAmount -= 1;

        if (this.flameSounds) {
            this.playFrequentSound(this.flameSounds);
        }

        const randomSpread = (Math.random() - 0.5) * SPREAD;
        const dir = this.rotateVector(directionX, directionY, randomSpread);

        this.bullets.push({
            x: spawnX,
            y: spawnY,
            xDirection: dir.x,
            yDirection: dir.y,
            bulletSpeed: this.bulletSpeed,
            offset: 0
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
                x: bullet.x - 10,
                y: bullet.y - 10,
                w: 20,
                h: 20
            };

            this.handleBulletsIntersecting(enemies, targets, bulletRect, bulletIndex);

            if (this.remoteEnemies && this.checkEntityCollision(bulletRect, this.remoteEnemies, null)) {
                return true;
            }

            this.countOffset(bullet, bulletIndex);

            if (this.map.checkCollision(bulletRect)) {
                return true;
            }
        }
        return false;
    }

    drawBullets(ctx, bulletImg) {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff4400';

        this.bullets.forEach(bullet => {
            ctx.save();
            ctx.translate(bullet.x, bullet.y);
            const angle = Math.atan2(bullet.yDirection, bullet.xDirection) + Math.PI / 2;
            ctx.rotate(angle);
            // Рисуем квадратный спрайт огня 20x20
            ctx.drawImage(bulletImg, -10, -10, 20, 20);
            ctx.restore();
        });
        ctx.restore();
    }

    countOffset(bullet, index) {
        const dVector = this.countVector(bullet.xDirection * bullet.bulletSpeed, bullet.yDirection * bullet.bulletSpeed);
        bullet.offset += dVector;

        if (bullet.offset > BULLET_DISTANCE) {
            if (!this.bulletsToRemove.includes(index)) {
                this.bulletsToRemove.push(index);
            }
        }
    }

    countVector(x, y) {
        return Math.sqrt(x * x + y * y);
    }
}