import { Character } from './Character.js';

const PLAYER_WIDTH = 48;
const PLAYER_HEIGHT = 48;
const SPEED = 4;

//константы стрельбы
const BULLET_SPEED = 20;
const BULLET_SIZE = 30;
const SPREAD_FACTOR = 10;
const SHOOT_COOLDOWN_MS = 150;
const DAMAGE = 10;

export class Player extends Character{
    constructor(map, input) {
        super(map.findFreeSpawn(), PLAYER_WIDTH, PLAYER_HEIGHT);

        this.speed = SPEED;
        this.input = input;

        //параметры стрельбы
        this.bullets = [];
        this.shotsFired = 0;
        this.lastShootTime = performance.now();
        this.damage = DAMAGE;
    }

    update(map, canvas, zoom, enemies) {
        if (!this.isAlive) return;
        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;

        // Насколько мышь ушла от центра (так как мы камеры зумили от центра)
        const worldMouseX = (this.input.mouseX - canvas.width / 2) / zoom + centerX;
        const worldMouseY = (this.input.mouseY - canvas.height / 2) / zoom + centerY;

        //Угол между мышкой и игроком, по сути по вектору находим
        this.angle = Math.atan2(worldMouseY - centerY, worldMouseX - centerX);

        let nextX = this.x;
        let nextY = this.y;

        if (this.input.isMouseDown) {
            //Используем perfomance, т.к. он не зависит от системного времени
            //Отсчёт времени с отрытия вкладки
            const now = performance.now();

            if (now - this.lastShootTime >= SHOOT_COOLDOWN_MS) {
                //добавляем пулю в массив и вешаем кулдаун
                this.createBullet(worldMouseX, worldMouseY);
                this.lastShootTime = now;
            }
        }

        if (this.input.isPressed('KeyW') || this.input.isPressed('ArrowUp')) {
            //X - COS, Y - SIN
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

        //Проверяем выход за пределы
        if (nextX < 0) nextX = 0;
        if (nextY < 0) nextY = 0;

        if (nextX + this.w > map.width) nextX = map.width - this.w;
        if (nextY + this.h > map.height) nextY = map.height - this.h;

        //Если коллизия по одной из координат то её не мянеяем
        if (!map.checkCollision({x: nextX, y: this.y, w: this.w, h: this.h})) {
            this.x = nextX;
        }

        if (!map.checkCollision({x: this.x, y: nextY, w: this.w, h: this.h})) {
            this.y = nextY;
        }

        this.handleBullets(map, enemies);
    }

    createBullet(targetX, targetY) {
        //создаём единичный вектор между начальной и конечной точкой (x^2 + y^2 = 1)

        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;

        const dx = targetX - centerX;
        const dy = targetY - centerY;
        const length = Math.sqrt(dx * dx + dy * dy);

        let directionX = dx / length;
        let directionY = dy / length;

        this.shotsFired++;

        //первые 2 пули летят без разброса, остальные с ним
        if (this.shotsFired > 1) {
            directionX += (Math.random() - 0.5) / SPREAD_FACTOR;
            directionY += (Math.random() - 0.5) / SPREAD_FACTOR;
        }
        
        //параметры: текущие координаты, направление по единичному вектору, множитель скорости
        this.bullets.push({
            x: centerX,
            y: centerY,
            xDirection: directionX,
            yDirection: directionY,
            bulletSpeed: BULLET_SPEED
        });
    }

    handleBullets(map, enemies) {
        //двигаем пули
        //если попали в объект, удаляем их из массива
        const toRemove = [];

        this.bullets.forEach((bullet, index) => {
            bullet.x += bullet.xDirection * bullet.bulletSpeed;
            bullet.y += bullet.yDirection * bullet.bulletSpeed;

            const r1 = {
                x: bullet.x - BULLET_SIZE / 2,
                y: bullet.y - BULLET_SIZE / 2,
                w: BULLET_SIZE,
                h: BULLET_SIZE
            };

            enemies.forEach((enemy) => {
                if (enemy.isAlive) {
                    const r2 = {x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h};
                    if (map.isIntersecting(r1, r2)) {
                        enemy.takeDamage(this.damage, map);
                        toRemove.push(index);
                    }
                }
            });

            if (map.checkCollision(r1)) {
                toRemove.push(index);
            }
        });  

        for (let i = toRemove.length - 1; i >= 0; i--) {
            this.bullets.splice(toRemove[i], 1);
        }
    }

    //отрисовываем пули из массива
    drawBullets(ctx, bulletImg) {
        this.bullets.forEach(bullet => {
            ctx.save();
            ctx.translate(bullet.x, bullet.y);
            
            // Поворачиваем в направлении движения
            const angle = Math.atan2(bullet.yDirection, bullet.xDirection);
            ctx.rotate(angle);
            
            ctx.drawImage(
                bulletImg,
                -BULLET_SIZE/2, -BULLET_SIZE/2, 
                BULLET_SIZE, BULLET_SIZE      
            );

            ctx.restore();
        });
    }
}