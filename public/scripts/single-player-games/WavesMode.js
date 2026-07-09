import { BaseGameTemplate } from './BaseGameTemplate.js';
import { Map } from '../core/Map.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';

// Карта может быть другой для этого режима
const wavesLevelData = `
################
#P            P#
#              #
#      BB      #
#      BB      #
#              #
#              #
#P            P#
################
`;

export class WavesMode extends BaseGameTemplate {
    init() {
        this.engine.map = new Map();
        this.engine.map.loadLevel(wavesLevelData);
        this.engine.player = new Player(this.engine.map, this.engine.input);

        this.currentWave = 1;
        this.spawnWave();
    }

    spawnWave() {
        this.engine.enemies = [];

        const enemiesCount = this.currentWave * 2;
        for (let i = 0; i < enemiesCount; i++) {
            this.engine.enemies.push(new Enemy(this.engine.map));
        }
    }

    update() {

        const aliveEnemies = this.engine.enemies.filter(e => e.isAlive || e.isDying);
        if (aliveEnemies.length === 0) {
            this.currentWave++;
            this.spawnWave();
        }
    }

    drawUI(ctx, canvas) {
        ctx.fillStyle = 'red';
        ctx.font = 'bold 30px Arial';
        const text = `ВОЛНА: ${this.currentWave}`;
        ctx.fillText(text, canvas.width / 2 - 70, 50);
    }
}