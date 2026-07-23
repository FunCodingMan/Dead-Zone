export class BloodManager {
    constructor() {
        this.bloodSpots = [];
    }

    addBloodSpot(entity, startHitpoints) {
        const centerX = entity.x + entity.w / 2;
        const centerY = entity.y + entity.h / 2;
        const spotSize = startHitpoints - entity.hitpoints;
        const randomAngle = Math.random() * Math.PI * 2;
        this.bloodSpots.push({ x: centerX, y: centerY, size: spotSize, angle: randomAngle });
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
}