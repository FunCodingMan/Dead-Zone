import { Input } from './utils/Input.js';
import { Map } from './core/Map.js';
import { Player } from './entities/Player.js';
import {Enemy} from './entities/Enemy.js';
import { initMenu, togglePauseUI } from './ui/Menu.js';

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
    explosions: []
};

const imagePaths = {
    wall: './assets/wall.png',
    box: './assets/box.png',
    floor: './assets/floor.png',
    soldier: './assets/soldier.png',
    bullet: './assets/bullet_new.png',
    blood: './assets/blood.png'
};

function loadImage(img, src) {
    return new Promise(resolve => {
        img.onload = resolve;
        img.src = src;
    });
}

const promises = [];

for (let key in imagePaths) {
    promises.push(loadImage(assets[key], imagePaths[key]));
}

for (let i = 0; i < DEATH_FRAMES_AMOUNT; i++) {
    assets.explosions[i] = new Image();
    promises.push(loadImage(assets.explosions[i], `./assets/burst${i + 1}.png`));
}
Promise.all(promises).then(() => {
    initMenu({
        onStart: startGame,
        onResume: togglePause,
        onRestart: () => {
            togglePause();
            startGame();
        },
        onExitToMenu: () => {
            isPaused = false;

            if (animationId) {
                cancelAnimationFrame(animationId);
            }

            if (input) {
                input.destroyListeners();
                input = null;
            }
        }
    });
});

function togglePause() {
    isPaused = !isPaused;
    togglePauseUI(isPaused);
}


const levelData = `
################
#P      #     B#
#  ###  #  B   #
#  #B#  #  B   #
#  ###  ####   #
#        P     #
#   #BBB#      #
#   # P #   BB #
#   #####   BB #
#              #
#B   P        B#
################
`;

let player, map, input, zoom, animationId;
let enemies = [];
let isPaused = false;

function startGame() {

    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    if (input) {
        input.destroyListeners();
    }

    input = new Input(canvas, {
        onEscape: togglePause
    });
    map = new Map();
    map.loadLevel(levelData);
    zoom = 1.5;


    player = new Player(map, input);
    enemies.push(new Enemy(map));
    enemies.push(new Enemy(map));
    enemies.push(new Enemy(map));
    enemies.push(new Enemy(map));

    gameLoop();
}

function gameLoop() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isPaused) {
        player.update(map, canvas, zoom, enemies);
    }

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-player.x - player.w / 2, -player.y - player.h / 2);

    map.draw(ctx, assets);
    map.drawBlood(ctx, assets.blood);

    if (player.isAlive) {
        player.draw(ctx, assets.soldier);
        player.drawBullets(ctx, assets.bullet);
    } else if (player.isDying) {
        player.drawDeath(ctx, assets.explosions);
    }

    enemies.forEach(enemy => {
        if (enemy.isAlive) {
            enemy.draw(ctx, assets.soldier);
        } else if (enemy.isDying) {
            enemy.drawDeath(ctx, assets.explosions);
        }
    });

    ctx.restore();

    animationId = requestAnimationFrame(gameLoop);
}