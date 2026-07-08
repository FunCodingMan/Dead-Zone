const PLAYER_WIDTH = 48;
const PLAYER_HEIGHT = 48;
const MAX_HITPOINTS = 100;

export class Player2 {
    constructor(map) {
        this.map = map;
        this.x = map.player2Spawn.x;
        this.y = map.player2Spawn.y;
        this.w = PLAYER_WIDTH;
        this.h = PLAYER_HEIGHT;
        this.angle = 0;
        this.hitpoints = MAX_HITPOINTS;
        this.isAlive = true;
        this.isDying = false;
        this.currentDeathFrame = 0;
        this.deathFrameDelay = 5;
        this.frameCounter = 0;
    }

    takeDamage(damage) {
        if (!this.isAlive) {
            return;
        }

        this.hitpoints -= damage;
        this.addBloodSpot();
        
        if (this.hitpoints <= 0) {
            this.isAlive = false;
            this.isDying = true;
            this.currentDeathFrame = 0;
            this.frameCounter = 0;
        }
    }

    addBloodSpot() {
        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;

        const spotSize = MAX_HITPOINTS - this.hitpoints;
        const randomAngle = Math.random() * Math.PI * 2;

        this.map.bloodSpots.push({x: centerX, y: centerY, size: spotSize, angle: randomAngle});
    }

    draw(ctx, soldierImg) {
        //Сохраняем текущий canvas
        ctx.save();
        //Смещаем начальную точку координат на цетр игрока
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        //Поворачиваем игрока на угол между мышкой и игроком
        ctx.rotate(this.angle + Math.PI / 2);
        //Отрисовываем игрока, при этом смещая его на половинку. так как до этого перемещали начальную точку координат
        ctx.drawImage(soldierImg, -this.w / 2, -this.h / 2, this.w, this.h);

        ctx.restore();
    }

    drawDeath(ctx, exposions) {
        if (this.frameCounter >= this.deathFrameDelay) {
            this.frameCounter = 0;
            this.currentDeathFrame++;
        }

        if (this.currentDeathFrame >= exposions.length) {
            this.isDying = false; 
            return;
        }

        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        ctx.drawImage(exposions[this.currentDeathFrame], -this.w / 2, -this.h / 2, this.w, this.h); 
        ctx.restore();

        this.frameCounter++;
    }
}
