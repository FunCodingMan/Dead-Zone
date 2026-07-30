import { BaseGameTemplate } from './BaseGameTemplate.js';
import { Enemy } from '../entities/Enemy.js';
import { CONFIG } from '../core/Config.js';
import { Sound } from "../core/Sound.js";
import { Boss } from '../entities/Boss.js';

const wavesLevelData = `
###################
######## E ########
####           ####
###      B      ###
##    B     B    ##
##               ##
##   B   Q   B   ##
##               ##
#                 #
#E   B   P   B   E#
#                 #
##               ##
##   B   Q   B   ##
##               ##
##    B     B    ##
###      B      ###
####           ####
######## E ########
###################
`;

const MAX_WAVES = 10;
const FPS = 60;
const CUTSCENE_DURATION = 2000;

export class WavesMode extends BaseGameTemplate {
    constructor(engine) {
        super(engine);

        this.isBossPhase = false;
        this.boss = null;

        this.cutsceneStartTIme;
    }

    getLevelData() {
        return wavesLevelData;
    }

    setupMode() {
        this.staticPathGraph = this.engine.map.buildPathGraph();

        this.currentWave = 1;
        this.lastAttackTime = 0;

        this.isBossPhase = false;
        this.boss = null;

        this.winSound = new Sound('../../assets/sounds/win.mp3');
        this.winSound.setVolume(0.8);

        this.defeatSound = new Sound('../../assets/sounds/defeat.mp3');
        this.defeatSound.setVolume(0.8);

        this.spawnWave();

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
            enemy.spotManager = this.engine.spotManager;
            this.engine.enemies.push(enemy);
            enemy.onDeath(() => {
                this.engine.player.kills++;
            });
        }
    }

    createBoss() {
        this.isBossPhase = true;
        this.engine.player.canShoot = false;
        this.cutsceneStartTIme = performance.now();

        const playerPosition = {
            x: this.engine.player.x,
            y: this.engine.player.y,
            w: this.engine.player.w,
            h: this.engine.player.h
        };

        this.boss = new Boss(
            this.engine.map,
            playerPosition
        );

        this.boss.bloodManager = this.engine.bloodManager;
        this.engine.boss = this.boss;
        this.engine.boss.isCutscene = true;

        this.engine.boss.bossRoar.play();
    }

    bossBehaviour() {
        const dx = this.engine.player.x - this.boss.x;
        const dy = this.engine.player.y - this.boss.y;

        if (!this.boss.isLaser) {
            this.boss.angle = Math.atan2(dy, dx) + Math.PI;
        }

        const current = performance.now();
        if (current - this.cutsceneStartTIme > CUTSCENE_DURATION) {
            this.engine.boss.isCutscene = false;
            this.engine.player.canShoot = true;
        }

        if (!this.engine.boss.isCutscene) {
            this.boss.selectBossAction(this.engine.player);
            this.boss.doBossAction(this.engine.player);
        }
    }


    update(dt) {
        if (!this.isInitializationReady) return;

        if (!this.engine.player.isAlive) {
            this.endGame(false);
            return;
        }

        if (!this.isBossPhase) {
            this.waveBehaviour(dt);
        } else {
            if (!this.engine.boss.isAlive && !this.engine.boss.isDying) {
                this.endGame(true);
                return;
            }
            this.bossBehaviour();
        }
    }

    waveBehaviour(dt) {
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
        }

        this.engine.playRandomEnemySound();

        aliveEnemies.forEach(enemy => {
            if (!enemy.isAlive) return;

            this.enemyPathFind(enemy, this.staticPathGraph, dt * FPS);
            const distance = Math.hypot(this.engine.player.x - enemy.x, this.engine.player.y - enemy.y);

            if (distance < enemy.attackDistance && currentTime - this.lastAttackTime > enemy.damageCooldown) {
                this.lastAttackTime = currentTime;
                this.engine.player.takeDamage(
                    enemy.damage,
                    this.engine.map,
                    CONFIG.PLAYER_SYMBOL
                );
            }
        });


        this.separateEnemies(aliveEnemies);
    }

    enemyPathFind(enemy, pathGraph, timeScale) {
        if (enemy.isDying) return;

        const playerPosition = this.engine.map.getCharacterPositionOnGrid(
            this.engine.player.x, this.engine.player.y, this.engine.player.w, this.engine.player.h
        );

        const currentCell = this.engine.map.getCharacterPositionOnGrid(enemy.x, enemy.y, enemy.w, enemy.h);

        if (!currentCell || !playerPosition ||
            currentCell.row == undefined || currentCell.col == undefined ||
            currentCell.row < 0 || currentCell.col < 0) {
            this.moveEnemyTowardsPixel(enemy, this.engine.player.x, this.engine.player.y, timeScale);
            return;
        }

        if (currentCell.row == playerPosition.row && currentCell.col == playerPosition.col) {
            this.moveEnemyTowardsPixel(enemy, this.engine.player.x, this.engine.player.y, timeScale);
            return;
        }

        const nextCell = this.engine.map.findNextCell(
            pathGraph,
            currentCell.row,
            currentCell.col,
            playerPosition.row,
            playerPosition.col
        );

        if (nextCell.row == currentCell.row && nextCell.col == currentCell.col) {
            this.moveEnemyTowardsPixel(enemy, this.engine.player.x, this.engine.player.y, timeScale);
            return;
        }

        const cellSize = this.engine.map.cellSize;
        const targetX = nextCell.col * cellSize + (cellSize - enemy.w) / 2;
        const targetY = nextCell.row * cellSize + (cellSize - enemy.h) / 2;

        this.moveEnemyTowardsPixel(enemy, targetX, targetY, timeScale);
    }

    moveEnemyTowardsPixel(enemy, targetX, targetY, timeScale) {
        const dx = targetX - enemy.x;
        const dy = targetY - enemy.y;

        const distance = Math.hypot(dx, dy);

        if (distance > 0) {
            const actualSpeed = enemy.speed * timeScale;

            const moveX = (dx / distance) * actualSpeed;
            const moveY = (dy / distance) * actualSpeed;

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

                if (distance == 0) {
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

                    if (this.engine.map) {
                        e1.x = Math.max(0, Math.min(e1.x, this.engine.map.width - e1.w));
                        e1.y = Math.max(0, Math.min(e1.y, this.engine.map.height - e1.h));
                        e2.x = Math.max(0, Math.min(e2.x, this.engine.map.width - e2.w));
                        e2.y = Math.max(0, Math.min(e2.y, this.engine.map.height - e2.h));
                    }
                }
            }
        }
    }

    drawUI(ctx, canvas) {
        if (!this.isInitializationReady) return;
        if (this.engine.isGameEnded) return;


        const uiScale = canvas.height / 1080;
        const fontSize = Math.floor(50 * uiScale);

        ctx.fillStyle = 'red';
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';

        if (!this.isBossPhase) {
            ctx.fillText( `ВОЛНА: ${this.currentWave}`, canvas.width / 2, 70 * uiScale );
        } else {
            ctx.fillText( `___ ЗАЯЦ ___`, canvas.width / 2, 70 * uiScale);
            const width = this.boss.hitpoints / CONFIG.BOSS_MAX_HITPOINTS * 1000;

            ctx.beginPath();
            ctx.roundRect(canvas.width / 2 - width / 2, 90 * uiScale, width, 25 * uiScale, 20);

            ctx.fill();
        }

        if (this.engine.player) {
            this.engine.player.drawCrosshair(ctx, canvas, this.engine.isPaused);
        }
    }

    endGame(isVictory) {
        if (this.engine.isGameEnded) return;

        const finalDamage = this.engine.player.appliedDamage;
        const finalKills = this.engine.player.kills;

        this.engine.stop();
        this.engine.isGameEnded = true;

        if (isVictory) {
            this.winSound.play();
        } else {
            this.defeatSound.play();
        }

        const params = new URLSearchParams({
            result: isVictory ? 'win' : 'lose',
            wave: this.currentWave,
            damage: finalDamage,
            kills: finalKills
        });

        setTimeout(() => {
            window.location.href = `/mode-selection/singleplayer/waves-final?${params.toString()}`;
        }, 2000);
    }
}