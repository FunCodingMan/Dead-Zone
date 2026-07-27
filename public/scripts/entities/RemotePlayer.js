import { Character } from "./Character.js";
import { CONFIG } from '../core/Config.js';

const PLAYER_WIDTH = 28;
const PLAYER_HEIGHT = 48;

export class RemotePlayer extends Character {
    constructor(id, initialX, initialY) {
        super({x: initialX, y: initialY}, PLAYER_WIDTH, PLAYER_HEIGHT, -1);

        this.id = id;
        this.nickname = "Player";
        this.className = CONFIG.SOLDIER_CLASS_NAME;
        this.playerClass = { className: CONFIG.SOLDIER_CLASS_NAME };

        this.targetX = initialX;
        this.targetY = initialY;

        this.hitpoints = 100;

        this.bullets = [];
        this.team = 'none';
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
        if (state.team !== undefined) {
            this.team = state.team;
        }
        if (state.className !== undefined) {
            this.className = state.className;
            this.playerClass.className = state.className;
        }
    }

    spawnFlameThrowerNetworkBullet(startX, startY, angle, localPlayer = null) {
        if (this.flameSounds) {
            this.playFrequentSound(this.flameSounds, localPlayer);
        }

        // Тот же трюк: 1 пакет от сервера = 4 визуальные искры на клиенте
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                const spreadAngle = angle + (Math.random() - 0.5) * 0.25; // 0.25 = SPREAD
                this.bullets.push({
                    x: startX,
                    y: startY,
                    xDirection: Math.cos(spreadAngle),
                    yDirection: Math.sin(spreadAngle),
                    bulletSpeed: 20,
                    offset: 0
                });
            }, i * 30);
        }
    }
    spawnSoldierNetworkBullet(startX, startY, angle, localPlayer = null) {
        if (this.shootSounds) {
            this.playFrequentSound(this.shootSounds, localPlayer);
        }
        this.bullets.push({
            x: startX,
            y: startY,
            xDirection: Math.cos(angle),
            yDirection: Math.sin(angle),
            bulletSpeed: 55,
            offset: 0
        });
    }

    spawnNetworkBullet(startX, startY, angle, localPlayer = null) {

        const isFlame = this.className === CONFIG.FLAMETHROWER_CLASS_NAME;

        if (isFlame) {
            this.spawnFlameThrowerNetworkBullet(startX, startY, angle, localPlayer);
        } else {
            this.spawnSoldierNetworkBullet(startX, startY, angle, localPlayer);
        }
    }

    updateInterpolation(interpolationFactor = 0.2, map = null, localPlayer = null, otherPlayers = null) {
        const prevX = this.x;
        const prevY = this.y;

        this.x += (this.targetX - this.x) * interpolationFactor;
        this.y += (this.targetY - this.y) * interpolationFactor;

        if (this.stepsSound) {
            if (Math.abs(this.x - prevX) > 0.1 || Math.abs(this.y - prevY) > 0.1) {
                if (localPlayer) {
                    this.stepsSound.updateDistanceVolume(this.x, this.y, localPlayer.x, localPlayer.y);
                }
                if (!this.stepsSound.isPlaying) {
                    this.stepsSound.play();
                }
            } else {
                if (this.stepsSound.isPlaying) {
                    this.stepsSound.stop();
                }
            }
        }

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
        const isFlame = this.className === CONFIG.FLAMETHROWER_CLASS_NAME;
        const bRW = isFlame ? 20 : 4;
        const bRH = isFlame ? 20 : 4;

        const steps = Math.ceil(bullet.bulletSpeed / 10);
        const stepX = (bullet.xDirection * bullet.bulletSpeed) / steps;
        const stepY = (bullet.yDirection * bullet.bulletSpeed) / steps;

        const stepDistance = Math.sqrt(stepX * stepX + stepY * stepY);

        for (let s = 0; s < steps; s++) {
            bullet.x += stepX;
            bullet.y += stepY;

            if (isFlame) {
                bullet.offset = (bullet.offset || 0) + stepDistance;
                if (bullet.offset > 250) {
                    return true;
                }
            }

            const bulletRect = {
                x: bullet.x - bRW / 2,
                y: bullet.y - bRH / 2,
                w: bRW,
                h: bRH
            };

            let hitEnemy = false;

            if (localPlayer && localPlayer.isAlive && map && map.isIntersecting(bulletRect, localPlayer)) {
                hitEnemy = true;
            }

            if (!hitEnemy && otherPlayers && map) {
                for (const [id, rp] of otherPlayers) {
                    if (id !== this.id && rp.hitpoints > 0 && map.isIntersecting(bulletRect, rp)) {
                        hitEnemy = true;
                        break;
                    }
                }
            }

            if (hitEnemy && !isFlame) {
                return true;
            }

            if (map && map.checkCollision(bulletRect)) {
                if (!isFlame) {
                    if (this.hitHardSounds && localPlayer) {
                        this.playFrequentSound(this.hitHardSounds, localPlayer, bulletRect.x, bulletRect.y);
                    }
                    return true;
                }
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

        const isFlame = this.className === CONFIG.FLAMETHROWER_CLASS_NAME;
        const bW = isFlame ? 20 : 3;
        const bH = isFlame ? 20 : 45;

        this.bullets.forEach(bullet => {
            ctx.save();
            ctx.translate(bullet.x, bullet.y);
            const angle = Math.atan2(bullet.yDirection, bullet.xDirection) + Math.PI / 2;
            ctx.rotate(angle);
            ctx.drawImage(bulletImg, -bW / 2, -bH / 2, bW, bH);
            ctx.restore();
        });

        ctx.restore();
    }

    draw(ctx, image, bulletImg, shot1Img, shot2Img) {
        super.draw(ctx, image);
        this.drawBullets(ctx, bulletImg);

        if (this.isShooting && shot1Img && shot2Img) {
            this.animateShots(ctx, shot1Img, shot2Img, this);
        }
    }
}