import { BaseGameTemplate } from './BaseGameTemplate.js';
import { Map } from '../core/Map.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { CONFIG } from '../core/Config.js';

const wavesLevelData = `
################
#P            E#
#              #
#       B  B   #
#      B  B    #
#     B  B     #
#    B  B      #
#E            E#
################
`;

const MAX_WAVES = 10;

export class WavesMode extends BaseGameTemplate {
    init() {
        this.engine.map = new Map();
        this.engine.map.loadLevel(wavesLevelData);
        this.engine.player = new Player(this.engine.map, this.engine.input, this.engine.resetPauseTime);
        this.engine.player.bloodManager = this.engine.bloodManager;

        this.staticPathGraph = this.engine.map.buildPathGraph();

        this.currentWave = 1;
        this.lastAttackTime = 0;

        this.spawnWave();
    }

    spawnWave() {
        this.engine.enemies = [];

        const enemiesCount = this.currentWave;
        for (let i = 0; i < enemiesCount; i++) {
            const playerPosition = {
                x: this.engine.player.x,
                y: this.engine.player.y,
                w: this.engine.player.w,
                h: this.engine.player.h
            };
            const enemy = new Enemy(this.engine.map, playerPosition);
            enemy.bloodManager = this.engine.bloodManager;
            this.engine.enemies.push(enemy);
            enemy.onDeath(() => {
                this.engine.player.kills++;
            });
        }
    }

    update() {
        const currentTime = performance.now();

        if (!this.engine.player.isAlive) {
            this.endGame(false);
            return;
        }

        const aliveEnemies = this.engine.enemies.filter(e => e.isAlive || e.isDying);
        if (aliveEnemies.length === 0) {
            if (this.currentWave >= MAX_WAVES) {
                this.endGame(true);
                return;
            }

            this.currentWave++;
            this.spawnWave();
            return;
        }

        aliveEnemies.forEach(enemy => {
            if (enemy.isAlive) {
                // Используем статический граф для поиска пути
                this.enemyPathFind(enemy, this.staticPathGraph);

                const distance = Math.sqrt(
                    (this.engine.player.x - enemy.x) ** 2 +
                    (this.engine.player.y - enemy.y) ** 2
                );

                if (distance < enemy.attackDistance && currentTime - this.lastAttackTime > enemy.damageCooldown) {
                    this.lastAttackTime = currentTime;
                    this.engine.player.takeDamage(enemy.damage, this.engine.map, CONFIG.PLAYER_SYMBOL);
                }
            }
        });

        this.separateEnemies(aliveEnemies);
    }

    enemyPathFind(enemy, pathGraph) {
        if (enemy.isDying) return;

        const playerPosition = this.engine.map.getCharacterPositionOnGrid(
            this.engine.player.x, this.engine.player.y, this.engine.player.w, this.engine.player.h
        );

        const currentCell = this.engine.map.getCharacterPositionOnGrid(enemy.x, enemy.y, enemy.w, enemy.h);

        if (currentCell.row === playerPosition.row && currentCell.col === playerPosition.col) {
            this.moveEnemyTowardsPixel(enemy, this.engine.player.x, this.engine.player.y);
            return;
        }

        const nextCell = this.engine.map.findNextCell(
            pathGraph,
            currentCell.row,
            currentCell.col,
            playerPosition.row,
            playerPosition.col
        );

        if (nextCell.row === currentCell.row && nextCell.col === currentCell.col) {
            this.moveEnemyTowardsPixel(enemy, this.engine.player.x, this.engine.player.y);
            return;
        }

        const cellSize = this.engine.map.cellSize;
        const targetX = nextCell.col * cellSize + (cellSize - enemy.w) / 2;
        const targetY = nextCell.row * cellSize + (cellSize - enemy.h) / 2;

        this.moveEnemyTowardsPixel(enemy, targetX, targetY);
    }

    moveEnemyTowardsPixel(enemy, targetX, targetY) {
        const dx = targetX - enemy.x;
        const dy = targetY - enemy.y;

        const distance = Math.hypot(dx, dy);

        if (distance > 0) {
            const moveX = (dx / distance) * enemy.speed;
            const moveY = (dy / distance) * enemy.speed;

            enemy.x += Math.abs(moveX) > Math.abs(dx) ? dx : moveX;
            enemy.y += Math.abs(moveY) > Math.abs(dy) ? dy : moveY;
        }

        const faceDx = this.engine.player.x - enemy.x;
        const faceDy = this.engine.player.y - enemy.y;

        enemy.angle = Math.atan2(faceDy, faceDx);
    }

    separateEnemies(enemies) {
        for (let i = 0; i < enemies.length; i++) {
            for (let j = i + 1; j < enemies.length; j++) {
                const e1 = enemies[i];
                const e2 = enemies[j];

                if (e1.isDying || e2.isDying) continue;

                let dx = e1.x - e2.x;
                let dy = e1.y - e2.y;
                let distance = Math.hypot(dx, dy);

                if (distance === 0) {
                    dx = Math.random() - 0.5;
                    dy = Math.random() - 0.5;
                    distance = Math.hypot(dx, dy);
                }
                const minDistance = e1.w;

                if (distance < minDistance) {
                    const overlap = minDistance - distance;
                    const pushFactor = 0.5;
                    const pushX = (dx / distance) * overlap * pushFactor;
                    const pushY = (dy / distance) * overlap * pushFactor;

                    e1.x += pushX;
                    e1.y += pushY;
                    e2.x -= pushX;
                    e2.y -= pushY;
                }
            }
        }
    }

    drawUI(ctx, canvas) {
        ctx.fillStyle = 'red';
        ctx.font = 'bold 30px Arial';
        const text = `ВОЛНА: ${this.currentWave}`;
        ctx.fillText(text, canvas.width / 2 - 70, 50);
    }

    endGame(isVictory) {
        const finalDamage = this.engine.player.appliedDamage;
        const finalKills = this.engine.player.kills;

        this.engine.stop();
        this.engine.isGameEnded = true;

        const params = new URLSearchParams({
            result: isVictory ? 'win' : 'lose',
            wave: this.currentWave,
            damage: finalDamage,
            kills: finalKills
        });

        window.location.href = `/mode-selection/singleplayer/waves-final?${params.toString()}`;
    }
}