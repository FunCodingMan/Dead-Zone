import { BaseGameTemplate } from './BaseGameTemplate.js';
import { Map } from '../core/Map.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';

const levelData = `
################
#P      #     B#
# ###   #  B  P#
# #B#   #  B   #
# ###  ####    #
#  P     P     #
#   #BBB#      #
#   # P #   BB #
#   #####   BB #
# P            #
#B   P        B#
################
`;
export class TrainingMode extends BaseGameTemplate {
    init() {
        // 1. Создаем карту
        this.engine.map = new Map();
        this.engine.map.loadLevel(levelData);

        // 2. Создаем игрока
        this.engine.player = new Player(this.engine.map, this.engine.input);

        // 3. Создаем врагов
        this.engine.enemies = [
            new Enemy(this.engine.map),
            new Enemy(this.engine.map),
            new Enemy(this.engine.map),
            new Enemy(this.engine.map)
        ];
    }

    update() {
        this.engine.enemies = this.engine.enemies.filter(e => e.isAlive || e.isDying);

        const aliveEnemies = this.engine.enemies.filter(e => e.isAlive);
        if (aliveEnemies.length < 4) {
            this.engine.enemies.push(new Enemy(this.engine.map));
        }
    }

    drawUI(ctx, canvas) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '24px Arial';
        ctx.fillText("РЕЖИМ: ТРЕНИРОВКА", 20, 40);
    }
}