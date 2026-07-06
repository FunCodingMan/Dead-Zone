export class Player {
    constructor(x, y, input) {
        this.x = x;
        this.y = y;
        this.w = 48;
        this.h = 48;
        this.speed = 4;
        this.input = input;
        this.angle = 0;
    }

    update(map, canvas, zoom) {
        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;

        const worldMouseX = (this.input.mouseX - canvas.width / 2) / zoom + centerX;
        const worldMouseY = (this.input.mouseY - canvas.height / 2) / zoom + centerY;

        this.angle = Math.atan2(worldMouseY - centerY, worldMouseX - centerX);

        let nextX = this.x;
        let nextY = this.y;

        if (this.input.isPressed('KeyW') || this.input.isPressed('ArrowUp')) {
            nextX += Math.cos(this.angle) * this.speed;
            nextY += Math.sin(this.angle) * this.speed;
        }
        if (this.input.isPressed('KeyS') || this.input.isPressed('ArrowDown')) {
            nextX -= Math.cos(this.angle) * this.speed;
            nextY -= Math.sin(this.angle) * this.speed;
        }

        if (this.input.isPressed('KeyA') || this.input.isPressed('ArrowLeft')) {
            nextX += Math.cos(this.angle - Math.PI / 2) * this.speed;
            nextY += Math.sin(this.angle - Math.PI / 2) * this.speed;
        }
        if (this.input.isPressed('KeyD') || this.input.isPressed('ArrowRight')) {
            nextX += Math.cos(this.angle + Math.PI / 2) * this.speed;
            nextY += Math.sin(this.angle + Math.PI / 2) * this.speed;
        }

        if (nextX < 0) nextX = 0;
        if (nextY < 0) nextY = 0;

        if (nextX + this.w > map.width) nextX = map.width - this.w;
        if (nextY + this.h > map.height) nextY = map.height - this.h;

        if (!map.checkCollision({x: nextX, y: this.y, w: this.w, h: this.h})) {
            this.x = nextX;
        }

        if (!map.checkCollision({x: this.x, y: nextY, w: this.w, h: this.h})) {
            this.y = nextY;
        }
    }

    draw(ctx, soldierImg) {
        ctx.save();

        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);

        ctx.rotate(this.angle + Math.PI / 2);

        ctx.drawImage(soldierImg, -this.w / 2, -this.h / 2, this.w, this.h);

        ctx.restore();
    }
}