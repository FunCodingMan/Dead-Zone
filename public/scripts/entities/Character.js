const MAX_HITPOINTS = 100;
const EXPLOSION_DURATION_MS = 400;

export class Character {
    constructor(spawn, width, height) {
        this.x = spawn.x;
        this.y = spawn.y;
        this.w = width;
        this.h = height;
        this.angle = 0;

        this.hitpoints = MAX_HITPOINTS;
        this.isAlive = true;
        this.isDying = false;

        this.deathStartTime = 0;

    }

    takeDamage(damage, map) {
        if (!this.isAlive) return;

        this.hitpoints -= damage;
        this.addBloodSpot(map);

        if (this.hitpoints <= 0) {
            this.isAlive = false;
            this.isDying = true;
            this.deathStartTime = performance.now();
        }
    }

    addBloodSpot(map) {
        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;
        const spotSize = MAX_HITPOINTS - this.hitpoints;
        const randomAngle = Math.random() * Math.PI * 2

        map.bloodSpots.push({ x: centerX, y: centerY, size: spotSize, angle: randomAngle });
    }

    draw(ctx, image) {
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        ctx.rotate(this.angle + Math.PI / 2);
        ctx.drawImage(image, -this.w / 2, -this.h / 2, this.w, this.h);
        ctx.restore();
    }
    drawDeath(ctx, explosions) {
        if (!this.isDying) return;

        const now = performance.now();
        const elapsed = now - this.deathStartTime;

        if (elapsed >= EXPLOSION_DURATION_MS) {
            this.isDying = false;
            return;
        }

        // Вычисляем, какой кадр показать
        const progress = elapsed / EXPLOSION_DURATION_MS;
        const frameIndex = Math.floor(progress * explosions.length);
        const currentFrame = explosions[frameIndex];

        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);

        // Делаем взрыв чуть больше самого персонажа (w * 1.2)
        ctx.drawImage(currentFrame, -(this.w * 1.2) / 2, -(this.h * 1.2) / 2, this.w * 1.2, this.h * 1.2);
        ctx.restore();
    }

}