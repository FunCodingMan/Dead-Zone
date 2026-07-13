import { Input } from '../utils/Input.js';
import { CONFIG } from './Config.js';
import { Map } from './Map.js';

const AVAILABLE_CELL = 1;
const UNAVAILABLE_CELL = 0;

export class Game {
    constructor(canvas, assets, onPauseToggle) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.assets = assets;
        this.onPauseToggle = onPauseToggle;

        this.isPaused = false;
        this.animationId = null;
        this.zoom = 1.5;

        this.map = null;
        this.player = null;
        this.enemies = [];
        this.targets = [];
        this.input = null;
        this.currentMode = null;

        this.loop = this.loop.bind(this);
    }

    start(ModeClass) {
        this.stop();

        this.input = new Input(this.canvas, {
            onEscape: () => {
                if (this.player && this.player.isAlive) this.togglePause();
            }
        });

        this.currentMode = new ModeClass(this);
        this.currentMode.init();

        this.isPaused = false;
        this.loop();
    }

    stop() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.currentMode && this.currentMode.destroy) {
            this.currentMode.destroy();
        }
        if (this.input) {
            this.input.destroyListeners();
            this.input = null;
        }
        this.enemies = [];
        this.targets = [];
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused && this.input) {
            this.input.reset();
        }
        this.onPauseToggle(this.isPaused);
    }

    loop() {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(this.loop);
    }

    buildPathGraph() {
        const mapData = this.map.grid;
        const rows = mapData.length;
        const cols = mapData[0].length;

        const graph = [];
        for (let row = 0; row < rows; row++) {
            graph[row] = [];
            for (let col = 0; col < cols; col++) {
                const cell = mapData[row][col];
                graph[row][col] = (cell === CONFIG.SPACE_SYMBOL) ? 1 : 0;
            }
        }

        const aliveEnemies = this.enemies.filter(e => e.isAlive || e.isDying);
        aliveEnemies.forEach(enemy => {
            const pos = this.map.getCharacterPositionOnGrid(enemy.x, enemy.y, enemy.w, enemy.h);
            graph[pos.row][pos.col] = 0;
        });

        const pos = this.map.getCharacterPositionOnGrid(
            this.player.x, this.player.y, this.player.w, this.player.h
        );
        graph[pos.row][pos.col] = 1;

        return graph;
    }

    findNextCell(graph, startRow, startCol, targetRow, targetCol) {
        const rows = graph.length;
        const cols = graph[0].length;

        const queue = [{row: startRow, col: startCol}];
        const visited = Array(rows).fill(null).map(() => Array(cols).fill(false));
        const parent = Array(rows).fill(null).map(() => Array(cols).fill(null));

        visited[startRow][startCol] = true;
        const directions = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
        const path = [];

        while (queue.length > 0) {
            const current = queue.shift();
            const {row, col} = current;

            if (row === targetRow && col === targetCol) {
                let curr = {row, col};
                while (curr.row !== startRow || curr.col !== startCol) {
                    path.push({row: curr.row, col: curr.col});
                    curr = parent[curr.row][curr.col];
                }
                path.push({ row: startRow, col: startCol });

                if (path.length >= 2) {
                    return path[path.length - 2];
                }
                return path[0];
            }

            for (const [dr, dc] of directions) {
                const newRow = row + dr;
                const newCol = col + dc;

                if (dr !== 0 && dc !== 0) {
                    if (graph[row][newCol] === 0 || graph[newRow][col] === 0) {
                        continue;
                    }
                }

                if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                    if (graph[newRow][newCol] === AVAILABLE_CELL && !visited[newRow][newCol]) {
                        visited[newRow][newCol] = true;
                        parent[newRow][newCol] = { row, col };
                        queue.push({ row: newRow, col: newCol });
                    }
                }
            }
        }

        return { row: startRow, col: startCol };
    }

    update() {
        if (this.isPaused) return;
        if (this.player) this.player.update(this.map, this.canvas, this.zoom, this.enemies, this.targets);

        if (this.currentMode) this.currentMode.update();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);


        this.ctx.save();
        if (this.player) {
            this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.scale(this.zoom, this.zoom);
            this.ctx.translate(-this.player.x - this.player.w / 2, -this.player.y - this.player.h / 2);
        }

        if (this.map) {
            this.map.draw(this.ctx, this.assets);
            this.map.drawBlood(this.ctx, this.assets.blood);
        }

        this.enemies.forEach(enemy => {
            if (enemy.isAlive) {
                enemy.draw(this.ctx, this.assets.zombie);
            } else if (enemy.isDying) {
                enemy.drawDeath(this.ctx, this.assets.explosions);
            }
        });

        this.targets.forEach(target => {
            if (target.isAlive) {
                target.draw(this.ctx, this.assets.target);
            } else if (target.isDying) {
                target.drawDeath(this.ctx, this.assets.explosions);
            }
        })

        if (this.player) {
            if (this.player.isAlive) {
                if (!this.player.isReloading) {
                    this.player.draw(this.ctx, this.assets.soldier);
                    if (!this.isPaused) this.player.animateShots(this.ctx, this.assets.shot1, this.assets.shot2, this.player);
                } else {
                    this.player.draw(this.ctx, this.assets.reloadSoldier);
                }
                this.player.drawBullets(this.ctx, this.assets.bullet);
            } else if (this.player.isDying) {
                this.player.drawDeath(this.ctx, this.assets.explosions);
            }
        }

        this.ctx.restore();

        if (this.player && this.player.isAlive) {
            this.player.drawReloadInterface(this.ctx, this.assets.reloadIcon, this.canvas);
            this.player.drawHPInterface(this.ctx, this.assets.heartIcon, this.canvas);
        }

        if (this.currentMode) {
            this.currentMode.drawUI(this.ctx, this.canvas);
        }
    }
}