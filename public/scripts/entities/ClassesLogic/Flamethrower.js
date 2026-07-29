import { CONFIG } from "../../core/Config.js";
import { Player } from "../Player.js";

const SPREAD = 0.25;
const BULLET_DISTANCE = 250;

export class Flamethrower extends Player {
    constructor(map, input, playerClass) {
        super(map, input, playerClass);
        this.speed = 3;
        this.damage = 50;
        this.maxShotsAmount = 125;
        this.shotsAmount = this.maxShotsAmount;
        this.shotCooldown = 120;
        this.shotOffsetForward = 12;
        this.shotOffsetSide = 3;
        this.bulletSpeed = 20;

        this.bulletDrawW = 20;
        this.bulletDrawH = 20;
        this.bulletPhysW = 20;
        this.bulletPhysH = 20;
    }

    playReloadSound() {
        if (this.flameReloadSound) {
            this.flameReloadSound.play();
        } else if (this.reloadSound) {
            this.reloadSound.play();
        }
    }

    getAmmoText() {
        return Math.round((this.shotsAmount / this.maxShotsAmount) * 100) + '%';
    }

    rotateVector(x, y, angle) {
        return {
            x: x * Math.cos(angle) - y * Math.sin(angle),
            y: x * Math.sin(angle) + y * Math.cos(angle)
        };
    }

    createBullet(targetX, targetY) {
        this.shotsAmount--;
        this.shotsFired++;

        if (this.flameSounds) {
            this.playFrequentSound(this.flameSounds);
        }

        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;

        let spawnX = centerX + Math.cos(this.angle) * this.shotOffsetForward;
        let spawnY = centerY + Math.sin(this.angle) * this.shotOffsetForward;

        spawnX += Math.cos(this.angle + Math.PI / 2) * this.shotOffsetSide;
        spawnY += Math.sin(this.angle + Math.PI / 2) * this.shotOffsetSide;

        const randomSpread = (Math.random() - 0.5) * SPREAD;
        const dirX = Math.cos(this.angle);
        const dirY = Math.sin(this.angle);
        const dir = this.rotateVector(dirX, dirY, randomSpread);

        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                const randomSpread = (Math.random() - 0.5) * SPREAD;
                const dirX = Math.cos(this.angle);
                const dirY = Math.sin(this.angle);
                const dir = this.rotateVector(dirX, dirY, randomSpread);

                this.bullets.push({
                    x: spawnX,
                    y: spawnY,
                    xDirection: dir.x,
                    yDirection: dir.y,
                    bulletSpeed: this.bulletSpeed,
                    offset: 0,
                    isVisualOnly: i > 0,
                    owner: CONFIG.PLAYER_SYMBOL,
                    width: this.bulletDrawW,
                    height: this.bulletDrawH,
                    physWidth: this.bulletPhysW,
                    physHeight: this.bulletPhysH,
                    damage: this.damage    
                });
            }, i * 30);
        }
    }

    processBulletPhysics(bullet, enemies, targets, boss, player, timeScale, bulletIndex) {
        const actualSpeed = bullet.bulletSpeed * timeScale;
        const steps = Math.max(1, Math.ceil(actualSpeed / 10));

        const stepX = (bullet.xDirection * actualSpeed) / steps;
        const stepY = (bullet.yDirection * actualSpeed) / steps;
        const stepDistance = Math.sqrt(stepX * stepX + stepY * stepY);

        for (let s = 0; s < steps; s++) {
            bullet.x += stepX;
            bullet.y += stepY;

            bullet.offset = (bullet.offset || 0) + stepDistance;

            const bulletRect = {
                x: bullet.x - this.bulletPhysW / 2,
                y: bullet.y - this.bulletPhysH / 2,
                w: this.bulletPhysW,
                h: this.bulletPhysH
            };

            if (!bullet.isVisualOnly) {

                const isHit = this.handleBulletsIntersecting(
                    enemies,
                    targets,
                    boss,
                    player,
                    bulletRect,
                    bullet.owner,
                    bullet.damage
                );

                if (isHit) {
                    if (!this.bulletsToRemove.includes(bulletIndex)) {
                        this.bulletsToRemove.push(bulletIndex);
                    }

                    return true;
                }
            }

            if (this.remoteEnemies) {
                this.checkEntityCollision(bulletRect, this.remoteEnemies, null);
            }

            if (bullet.offset > BULLET_DISTANCE) {
                if (!this.bulletsToRemove.includes(bulletIndex)) {
                    this.bulletsToRemove.push(bulletIndex);
                }
                return true;
            }
        }
        return false;
    }
}