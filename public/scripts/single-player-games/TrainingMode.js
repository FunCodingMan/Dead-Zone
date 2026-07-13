import { BaseGameTemplate } from './BaseGameTemplate.js';
import { Map } from '../core/Map.js';
import Player from '../entities/Player.js';
import { Target } from '../entities/Target.js';

const TARGETS_AMOUNT = 4;

const levelData = `
################
#P      #     B#
# ###   #  B  T#
# #B#   #  B   #
# ###  ####    #
#  T     T     #
#   #BBB#      #
#   # T #   BB #
#   #####   BB #
# T            #
#B   T        B#
################
`;
export class TrainingMode extends BaseGameTemplate {
    init() {
        this.engine.map = new Map();
        this.engine.map.loadLevel(levelData);

        this.engine.player = new Player(this.engine.map, this.engine.input);

        // 3. Создаем мишени
        this.engine.targets = [];
        for (let i = 0; i < TARGETS_AMOUNT; i++) {
            const target = new Target(this.engine.map);
            
            target.onDeath(() => {
                this.engine.player.kills++;
            });
            this.engine.targets.push(target);
        }            
    }

    update() {
        this.engine.targets = this.engine.targets.filter(t => t.isAlive || t.isDying);

        const aliveTargets = this.engine.targets.filter(t => t.isAlive);
        if (aliveTargets.length < TARGETS_AMOUNT) {
            const target = new Target(this.engine.map);
            this.engine.targets.push(target);
            target.onDeath(() => {
                this.engine.player.kills++;
            });
        }
    }

    drawUI(ctx, canvas) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '24px Arial';
        ctx.fillText("РЕЖИМ: ТРЕНИРОВКА", 20, 40);
        ctx.fillText("НАНЕСЕНО УРОНА: " + this.engine.player.appliedDamage, 20, 60);
        ctx.fillText("УНИЧТОЖЕНО ЦЕЛЕЙ: " + this.engine.player.kills, 20, 80);
    }
}