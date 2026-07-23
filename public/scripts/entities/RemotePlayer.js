import { Character } from "./Character.js";

const PLAYER_WIDTH = 28;
const PLAYER_HEIGHT = 48;
const BULLET_SPEED = 55;
const BULLET_WIDTH = 3;
const BULLET_HEIGHT = 45;

export class RemotePlayer extends Character {
    constructor(id, initialX, initialY) {
        super({x: initialX, y: initialY}, PLAYER_WIDTH, PLAYER_HEIGHT,  -1);

        this.id = id;
        this.nickname = "Player";

        this.targetX = initialX;
        this.targetY = initialY;

        this.hitpoints = 100;

        this.bullets = [];
    }

    updateServerState(state) {
        this.targetX = state.x;
        this.targetY = state.y;
        if (state.angle !== undefined) {
            this.angle = state.angle;
        }

        if (state.health !== undefined) {
            this.hitpoints = state.health;
        }

        if (state.nickname !== undefined) {
            this.nickname = state.nickname;
        }
    }

    spawnNetworkBullet(startX, startY, angle) {
        const directionX = Math.cos(angle);
        const directionY = Math.sin(angle);

        this.bullets.push({
            x: startX,
            y: startY,
            xDirection: directionX,
            yDirection: directionY,
            bulletSpeed: BULLET_SPEED
        });
    }

    updateInterpolation(interpolationFactor = 0.2, map = null, localPlayer = null, otherPlayers = null) {
        this.x += (this.targetX - this.x) * interpolationFactor;
        this.y += (this.targetY - this.y) * interpolationFactor;

        this.handleNetworkBullets(map, localPlayer, otherPlayers);
    }

    handleNetworkBullets(map, localPlayer, otherPlayers) {
        const toRemove = [];

        for (let i = 0; i < this.bullets.length; i++) {
            const isHit = this.processBulletPhysics(this.bullets[i], map, localPlayer, otherPlayers);
            if (isHit) {
                toRemove.push(i);
            }
        }

        for (let i = toRemove.length - 1; i >= 0; i--) {
            this.bullets.splice(toRemove[i], 1);
        }
    }

    processBulletPhysics(bullet, map, localPlayer, otherPlayers) {
        const steps = Math.ceil(bullet.bulletSpeed / 10);
        const stepX = (bullet.xDirection * bullet.bulletSpeed) / steps;
        const stepY = (bullet.yDirection * bullet.bulletSpeed) / steps;

        for (let s = 0; s < steps; s++) {
            bullet.x += stepX;
            bullet.y += stepY;

            const bulletRect = {
                x: bullet.x - BULLET_WIDTH / 2,
                y: bullet.y - BULLET_HEIGHT / 2,
                w: BULLET_WIDTH,
                h: BULLET_HEIGHT
            };

            if (localPlayer && localPlayer.isAlive && map && map.isIntersecting(bulletRect, localPlayer)) {
                return true;
            }

            if (otherPlayers && map) {
                for (const [id, rp] of otherPlayers) {
                    if (id !== this.id && rp.hitpoints > 0 && map.isIntersecting(bulletRect, rp)) {
                        return true;
                    }
                }
            }

            if (map && map.checkCollision(bulletRect)) {
                return true;
            }
        }

        return false;
    }

    takeDamage(damage, map, symbol) {

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

    draw(ctx, image, bulletImg, shot1Img, shot2Img) {
        super.draw(ctx, image);
        this.drawBullets(ctx, bulletImg);

        if (this.isShooting && shot1Img && shot2Img) {
            this.animateShots(ctx, shot1Img, shot2Img);
        }
    }
}