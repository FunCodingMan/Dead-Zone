import { MAX_HITPOINTS } from "../entities/Character.js";

const POISON_SPOT_SIZE = 75;

export class SpotsManager {
    constructor() {
        this.bloodSpots = [];
        this.poisonSpots = [];
    }

    addBloodSpot(entity) {
        const centerX = entity.x + entity.w / 2;
        const centerY = entity.y + entity.h / 2;
        const spotSize = MAX_HITPOINTS - entity.hitpoints;
        const randomAngle = Math.random() * Math.PI * 2;
        this.bloodSpots.push({ x: centerX, y: centerY, size: spotSize, angle: randomAngle });
    }

    addPoisonSpot(x, y) {
        const randomAngle = Math.random() * Math.PI * 2;
        this.poisonSpots.push({
            x: x,
            y: y,
            size: POISON_SPOT_SIZE,
            angle: randomAngle,
            spawnTime: performance.now()
        });
    }

    drawBlood(ctx, bloodImg) {
        this.bloodSpots.forEach(spot => {
            ctx.save();
            ctx.translate(spot.x, spot.y);
            
            ctx.rotate(spot.angle);
            
            ctx.drawImage(
                bloodImg,
                -spot.size/2, -spot.size/2, 
                spot.size, spot.size      
            );

            ctx.restore();
        });
    }

    drawPoison(ctx, poisonImg) {
        this.poisonSpots.forEach(spot => {
            ctx.save();
            ctx.translate(spot.x, spot.y);
            
            ctx.rotate(spot.angle);
            
            ctx.drawImage(
                poisonImg,
                -spot.size/2, -spot.size/2, 
                spot.size, spot.size      
            );

            ctx.restore();
        });
    }
}