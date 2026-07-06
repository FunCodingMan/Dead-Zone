export class Map {
    constructor() {
        this.cellSize = 64;

        this.playerSize = 48;


        this.walls = [];
        this.boxes = [];
        this.playerSpawn = {x: 50, y: 50};
    }

    loadLevel(levelString) {
        this.walls = [];
        this.boxes = [];

        const lines = levelString.trim().split('\n');
        //Рассчитываем высоту и ширину умножая на размер клетки
        this.height = lines.length * this.cellSize;

        this.width = lines[0].trim().length * this.cellSize;

        for (let row = 0; row < lines.length; row++) {
            const line = lines[row].trim();
            for (let col = 0; col < line.length; col++) {
                const char = line[col];

                const x = col * this.cellSize;
                const y = row * this.cellSize;

                switch (char) {
                    //Стена
                    case "#":
                        this.walls.push({x, y, w: this.cellSize, h: this.cellSize});
                        break;
                    //Коробка
                    case "B":
                        this.boxes.push({x, y, w: this.cellSize, h: this.cellSize});
                        break;
                    //Спавн игрока
                    case "P":
                        this.playerSpawn = {
                            x: x + (this.cellSize - this.playerSize) / 2,
                            y: y + (this.cellSize - this.playerSize) / 2
                        }
                        break;
                }
            }
        }
    }

    draw(ctx, assets) {
        //Рисуем пол
        for (let x = 0; x < this.width; x += this.cellSize) {
            for (let y = 0; y < this.height; y += this.cellSize) {
                ctx.drawImage(assets.floor, x, y, this.cellSize, this.cellSize);
            }
        }
        //Рисуем стены
        for (let wall of this.walls) {
            ctx.drawImage(assets.wall, wall.x, wall.y, wall.w, wall.h);
        }
        //Рисуем коробки
        for (let box of this.boxes) {
            ctx.drawImage(assets.box, box.x, box.y, box.w, box.h);
        }
    }

    checkCollision(rect) {
        for (let wall of this.walls) {
            if (this.isIntersecting(rect, wall)) {
                return true;
            }
        }
        for (let box of this.boxes) {
            if (this.isIntersecting(rect, box)) {
                return true;
            }
        }
        return false;
    }

    isIntersecting(r1, r2) {
        return r1.x < r2.x + r2.w &&
               r1.x + r1.w > r2.x &&
               r1.y < r2.y + r2.h &&
               r1.y + r1.h > r2.y;
    }
}