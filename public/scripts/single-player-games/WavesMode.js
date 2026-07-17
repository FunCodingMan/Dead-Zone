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

    const MAX_WAVES = 20;

    export class WavesMode extends BaseGameTemplate {
        init() {
            this.engine.map = new Map();
            this.engine.map.loadLevel(wavesLevelData);
            this.engine.player = new Player(this.engine.map, this.engine.input);
            this.engine.player.bloodManager = this.engine.bloodManager;

            this.currentWave = 1;
            this.spawnWave();

            this.lastAttackTime = 0;
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

            let aliveEnemies = this.engine.enemies.filter(e => e.isAlive || e.isDying);
            if (aliveEnemies.length == 0) {
                if (this.currentWave >= MAX_WAVES) {
                    this.endGame(true);
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

        drawUI(ctx, canvas) {
            ctx.fillStyle = 'red';
            ctx.font = 'bold 30px Arial';
            const text = `ВОЛНА: ${this.currentWave}`;
            ctx.fillText(text, canvas.width / 2 - 70, 50);
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