import { Input } from './utils/Input.js';
import { Map } from './core/Map.js';
import { Player } from './entities/Player.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const assets = {
    wall: new Image(),
    box: new Image(),
    floor: new Image(),
    soldier: new Image(),
    bullet: new Image()
};

assets.wall.src = './assets/wall.png';
assets.box.src = './assets/box.png';
assets.floor.src = './assets/floor.png';
assets.soldier.src = './assets/soldier.png';
assets.bullet.src = './assets/bullet.png';

const levelData = `
################
#P      #     B#
#  ###  #  B   #
#  #B#  #  B   #
#  ###  ####   #
#              #
#   #BBB#      #
#   #   #   BB #
#   #####   BB #
#              #
#B            B#
################
`;

const input = new Input(canvas);

const map = new Map();

map.loadLevel(levelData);

const player = new Player(map.playerSpawn.x, map.playerSpawn.y, input);
//Зум карты
const zoom = 1.5;
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.update(map, canvas, zoom);

    //Сохраняем текущий canvas
    ctx.save();
    //Перемещаемся в центр canvas
    ctx.translate(canvas.width / 2, canvas.height / 2);
    //Увеличаем массштаб
    ctx.scale(zoom, zoom);
    //Смещаемся на координаты игрока, дабы он стал центром (учитываем ширину и высоту)
    ctx.translate(-player.x - player.w / 2, -player.y - player.h / 2);

    map.draw(ctx, assets);

    player.draw(ctx, assets.soldier, assets.bullet);

    //Восстанавливаем остальной canvas
    ctx.restore();

    requestAnimationFrame(gameLoop);
}

assets.soldier.onload = () => {
    gameLoop();
};