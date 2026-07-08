import { Input } from './utils/Input.js';
import { Map } from './core/Map.js';
import { Player } from './entities/Player.js';
import { Player2 } from './entities/Player2.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const DEATH_FRAMES_AMOUNT = 3;

const assets = {
    wall: new Image(),
    box: new Image(),
    floor: new Image(),
    soldier: new Image(),
    bullet: new Image(),
    blood: new Image(),
    exposions: []
};

const imagePaths = {
    wall: './assets/wall.png',
    box: './assets/box.png',
    floor: './assets/floor.png',
    soldier: './assets/soldier.png',
    bullet: './assets/bullet.png',
    blood: './assets/blood.png'
};

for (let key in imagePaths) {
    assets[key].src = imagePaths[key];
}

for (let i = 0; i < DEATH_FRAMES_AMOUNT; i++) {
    assets.exposions[i] = new Image();
    assets.exposions[i].src = `./assets/burst${i + 1}.png`;
}

let loaded = 0;
const total = Object.keys(imagePaths).length + DEATH_FRAMES_AMOUNT;

function checkLoad() {
    loaded++;
    if (loaded == total) {
        startGame();
    }
}

for (let key in imagePaths) {
    assets[key].onload = checkLoad;
}
for (let i = 0; i < DEATH_FRAMES_AMOUNT; i++) {
    assets.exposions[i].onload = checkLoad;
}

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

let player, player2, map, input, zoom;

function startGame() {
    input = new Input(canvas);
    map = new Map();
    map.loadLevel(levelData);
    zoom = 1.5;
    
    player = new Player(map, input);
    player2 = new Player2(map);
    
    gameLoop();
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.update(map, canvas, zoom, player2);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-player.x - player.w / 2, -player.y - player.h / 2);

    map.draw(ctx, assets);
    map.drawBlood(ctx, assets.blood);

    if (player.isAlive) {
        player.draw(ctx, assets.soldier, assets.bullet);
    }
    
    if (player2.isAlive) {
        player2.draw(ctx, assets.soldier);
    } else if (player2.isDying) {
        player2.drawDeath(ctx, assets.exposions);
    }

    ctx.restore();

    requestAnimationFrame(gameLoop);
}