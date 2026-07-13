import { BaseGameTemplate } from './BaseGameTemplate.js';
import { Map } from '../core/Map.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { CONFIG } from '../core/Config.js';

// Карта может быть другой для этого режима
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

export class WavesMode extends BaseGameTemplate {
    init() {
        this.engine.map = new Map();
        this.engine.map.loadLevel(wavesLevelData);
        this.engine.player = new Player(this.engine.map, this.engine.input);

        this.currentWave = 1;
        this.spawnWave();

        this.lastAttackTime = 0;
    }

    spawnWave() {
        this.engine.enemies = [];

        const enemiesCount = this.currentWave;
        for (let i = 0; i < enemiesCount; i++) {
            this.engine.enemies.push(new Enemy(this.engine.map));
        }
    }

    update() {
        const currentTime = performance.now();

        const aliveEnemies = this.engine.enemies.filter(e => e.isAlive || e.isDying);
        if (aliveEnemies.length === 0) {
            this.currentWave++;
            this.spawnWave();
            return;
        }

        aliveEnemies.forEach(enemy => {
            const distance = Math.sqrt(
                (this.engine.player.x - enemy.x) * (this.engine.player.x - enemy.x) +
                (this.engine.player.y - enemy.y) * (this.engine.player.y - enemy.y)
            );

            if (!enemy.isDying) {
                const pathGraph = this.engine.buildPathGraph();
                const playerPosition = this.engine.map.getCharacterPositionOnGrid(
                    this.engine.player.x, this.engine.player.y, this.engine.player.w, this.engine.player.h
                );

                const currentCell = this.engine.map.getCharacterPositionOnGrid(enemy.x, enemy.y, enemy.w, enemy.h);

                const nextCell = this.engine.findNextCell(
                    pathGraph,
                    currentCell.row,
                    currentCell.col,
                    playerPosition.row,
                    playerPosition.col
                );

                enemy.x += (nextCell.col - currentCell.col) * enemy.speed;
                enemy.y += (nextCell.row - currentCell.row) * enemy.speed;

                const dx = this.engine.player.x - enemy.x;
                const dy = this.engine.player.y - enemy.y;
                enemy.angle = Math.atan2(dy, dx);
            }

            console.log(distance, enemy.attackDistance);
            if (distance < enemy.attackDistance && currentTime - this.lastAttackTime > enemy.damageCooldown) {
                this.lastAttackTime = currentTime;
                this.engine.player.takeDamage(enemy.damage, this.engine.map, CONFIG.PLAYER_SYMBOL);
            }
        });
    }

    drawUI(ctx, canvas) {
        ctx.fillStyle = 'red';
        ctx.font = 'bold 30px Arial';
        const text = `ВОЛНА: ${this.currentWave}`;
        ctx.fillText(text, canvas.width / 2 - 70, 50);
    }
}