import { BaseGameTemplate } from './BaseGameTemplate.js';
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
    getLevelData() {
        return levelData;
    }

    setupMode() {
        this.engine.targets = [];
        for (let i = 0; i < TARGETS_AMOUNT; i++) {
            const playerPosition = {
                x: this.engine.player.x, 
                y: this.engine.player.y, 
                w: this.engine.player.w, 
                h: this.engine.player.h
            };
            const target = new Target(this.engine.map, playerPosition);
            
            target.onDeath(() => {
                this.engine.player.kills++;
            });
            this.engine.targets.push(target);
        }       
        
        this.isInitializationReady = true;
    }

    update() {
        if (!this.isInitializationReady) return;

        this.engine.targets = this.engine.targets.filter(t => t.isAlive || t.isDying);

        const aliveTargets = this.engine.targets.filter(t => t.isAlive);
        if (aliveTargets.length < TARGETS_AMOUNT) {
            const playerPosition = {
                x: this.engine.player.x, 
                y: this.engine.player.y, 
                w: this.engine.player.w, 
                h: this.engine.player.h
            };
            const target = new Target(this.engine.map, playerPosition);
            this.engine.targets.push(target);
            target.onDeath(() => {
                this.engine.player.kills++;
            });
        }
    }

    drawUI(ctx, canvas) {
        if (!this.isInitializationReady) return;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '24px Arial';
        ctx.fillText("РЕЖИМ: ТРЕНИРОВКА", 20, 40);
        ctx.fillText("НАНЕСЕНО УРОНА: " + this.engine.player.appliedDamage, 20, 60);
        ctx.fillText("УНИЧТОЖЕНО ЦЕЛЕЙ: " + this.engine.player.kills, 20, 80);
    }
}