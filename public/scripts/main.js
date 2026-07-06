import { Input } from './utils/Input.js';
import { Map } from './core/Map.js';
import { Player } from './entities/Player.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const assets = {
    wall: new Image(),
    box: new Image(),
    floor: new Image(),
    soldier: new Image()
};

assets.wall.src = './assets/wall.png';
assets.box.src = './assets/box.png';
assets.floor.src = './assets/floor.png';
assets.soldier.src = './assets/soldier.png';

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

const zoom = 1.5;
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.update(map, canvas, zoom);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-player.x - player.w / 2, -player.y - player.h / 2);

    map.draw(ctx, assets);

    player.draw(ctx, assets.soldier);

    ctx.restore();

    requestAnimationFrame(gameLoop);
}

assets.soldier.onload = () => {
    gameLoop();
};