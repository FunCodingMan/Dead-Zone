import { BaseGameTemplate } from './BaseGameTemplate.js';
import { Target } from '../entities/Target.js';
import { Turret } from '../entities/Turret.js';

const TARGETS_AMOUNT = 4;
const TURRETS_AMOUNT = 4;

const levelData = `
################
#P      #     B#
# ###   #  B  T#
# #B# R #  B   #
# ###  ####  R #
#T       T     #
#   #BBB#    #
#R  #   #   BB #
#   #####   BB #
# T R    R   R #
#B   T   T   RB#
################
`;
export class TrainingMode extends BaseGameTemplate {
    getLevelData() {
        return levelData;
    }

    setupMode() {
        this.engine.targets = [];
        this.engine.turrets = [];

        const playerPosition = {
            x: this.engine.player.x, 
            y: this.engine.player.y, 
            w: this.engine.player.w, 
            h: this.engine.player.h
        };

        for (let i = 0; i < TURRETS_AMOUNT; i++) {
            const turret = new Turret(this.engine.map, playerPosition);
            
            turret.onDeath(() => {
                this.engine.player.kills++;
            });
            this.engine.turrets.push(turret);
        }       

        for (let i = 0; i < TARGETS_AMOUNT; i++) {
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
        this.engine.turrets = this.engine.turrets.filter(t => t.isAlive || t.isDying);

        const playerPosition = {
            x: this.engine.player.x, 
            y: this.engine.player.y, 
            w: this.engine.player.w, 
            h: this.engine.player.h
        };

        const aliveTurrets = this.engine.turrets.filter(t => t.isAlive);
        const aliveTargets = this.engine.targets.filter(t => t.isAlive);

        if (aliveTargets.length < TARGETS_AMOUNT) {

            const target = new Target(this.engine.map, playerPosition);
            this.engine.targets.push(target);
            target.onDeath(() => {
                this.engine.player.kills++;
            });
        }

        if (aliveTurrets.length < TURRETS_AMOUNT) {

            const turret = new Turret(this.engine.map, playerPosition);
            this.engine.turrets.push(turret);
            turret.onDeath(() => {
                this.engine.player.kills++;
            });
        }

        this.turretsBehaviour();
    }

    turretsBehaviour() {
        const target = {x: this.engine.player.x, y: this.engine.player.y};

        this.engine.turrets.forEach(turret => {
            const dx = turret.x - target.x;
            const dy = turret.y - target.y; 
            
            turret.angle = Math.atan2(dy, dx);

            turret.manageTurretBullets(this.engine.player);
        });

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