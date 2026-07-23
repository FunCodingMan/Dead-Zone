import { BaseGameTemplate } from './BaseGameTemplate.js';
import { Enemy } from '../entities/Enemy.js';
import { CONFIG } from '../core/Config.js';
import { Boss } from '../entities/Boss.js';

    // Карта может быть другой для этого режимаs
    const wavesLevelData = `
    ################
    #P       B    E#
    # Q         R     #
    #        B     #
    #  R           #
    #           Q  #
    #   B          #
    #E        R   E#
    ################
    `;

    const MAX_WAVES = 1;
    const MAX_BOSS_HEALTHBAR_WIDTH = 1000;

    export class WavesMode extends BaseGameTemplate {
        constructor(engine) {
            super(engine);
            this.isBossPhase = false;
        }

        getLevelData() {
            return wavesLevelData;
        }

        setupMode() {
            this.currentWave = 1;
            this.spawnWave();

            this.lastAttackTime = 0;

            this.isInitializationReady = true;
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

        waveBehaviour() {
            const currentTime = performance.now();

            let aliveEnemies = this.engine.enemies.filter(e => e.isAlive || e.isDying);
            if (aliveEnemies.length == 0) {
                if (this.currentWave >= MAX_WAVES) {
                    this.createBoss();
                    return;
                }
                    
                this.currentWave++;
                this.spawnWave();
                return;
            } else {
                this.engine.playRandomEnemySound();
            }

            aliveEnemies = aliveEnemies.filter(e => e.isAlive);
            aliveEnemies.forEach(enemy => {
                this.enemyPathFind(enemy);

                const distance = Math.sqrt(
                    (this.engine.player.x - enemy.x) * (this.engine.player.x - enemy.x) +
                    (this.engine.player.y - enemy.y) * (this.engine.player.y - enemy.y)
                );

                if (distance < enemy.attackDistance && currentTime - this.lastAttackTime > enemy.damageCooldown) {
                    this.lastAttackTime = currentTime;
                    this.engine.player.takeDamage(enemy.damage, this.engine.map, CONFIG.PLAYER_SYMBOL);
                }
            });
        }

        enemyPathFind(enemy) {
            const pathGraph = this.engine.map.buildPathGraph(this.engine.player, this.engine.enemies);
            const playerPosition = this.engine.map.getCharacterPositionOnGrid(
                this.engine.player.x, this.engine.player.y, this.engine.player.w, this.engine.player.h
            );

            const currentCell = this.engine.map.getCharacterPositionOnGrid(enemy.x, enemy.y, enemy.w, enemy.h);

            const nextCell = this.engine.map.findNextCell(
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

        update() {
            if (!this.isInitializationReady) return;

            if (!this.engine.player.isAlive) {
                this.endGame(false);
                return;
            }

            if (!this.isBossPhase) {
                this.waveBehaviour();
            } else {
                if (!this.engine.boss.isAlive && !this.engine.boss.isDying) {
                    this.endGame(true);
                    return;
                }

                this.bossBehaviour();
            }
        }

        createBoss() {
            this.isBossPhase = true;

            const playerPosition = {
                x: this.engine.player.x, 
                y: this.engine.player.y, 
                w: this.engine.player.w, 
                h: this.engine.player.h
            };
            this.engine.boss =  new Boss(this.engine.map, playerPosition);
            this.engine.boss.bloodManager = this.engine.bloodManager;
        }

        bossBehaviour() {
            const target = {x: this.engine.player.x, y: this.engine.player.y};

            const dx = this.engine.boss.x - target.x ;
            const dy = this.engine.boss.y - target.y;

            if (!this.engine.boss.isLaser) {
                this.engine.boss.angle = Math.atan2(dy, dx);
            }
            
            this.engine.boss.selectBossAction(this.engine.player);
            this.engine.boss.doBossAction(this.engine.player);
        }

        drawUI(ctx, canvas) {
            if (!this.isInitializationReady) return;

            ctx.fillStyle = 'red';
            ctx.font = 'bold 30px Arial';
            let text;

            if (!this.isBossPhase) {
                text = `ВОЛНА: ${this.currentWave}`;
            } else {
                text = `___ ЗАЯЦ ___`;

                const width = this.engine.boss.hitpoints / CONFIG.BOSS_MAX_HITPOINTS * MAX_BOSS_HEALTHBAR_WIDTH;  

                ctx.beginPath();
                ctx.roundRect(canvas.width / 2 - width / 2, 70, width, 25, 20); 
                ctx.fill();
            }
  
            ctx.textAlign = 'center';
            ctx.fillText(text, canvas.width / 2, 50);
        }

        endGame(isVictory) {
            this.engine.stop();
            this.engine.isGameEnded = true;

            const params = new URLSearchParams({
                result: isVictory ? 'win' : 'lose',
                wave: this.currentWave,
                damage: this.engine.player.appliedDamage,
                kills: this.engine.player.kills
            });

            window.location.href = `/mode-selection/singleplayer/waves-final?${params.toString()}`;
        }
    }