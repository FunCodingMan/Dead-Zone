import { CONFIG } from "./Config.js";

const RESPAWN_INTERVAL = 2000;
const AVAILABLE_CELL = 1;
const UNAVAILABLE_CELL = 0;

export class Map {
    constructor() {
        this.cellSize = 64;
        this.playerSize = 48;

        this.walls = [];
        this.boxes = [];
        this.playerSpawns = [];
        this.enemySpawns = [];
        this.targetSpawns = [];

        this.grid = [];
        this.diedTargets = [];
    }

    getCharacterPositionOnGrid(coordX, coordY, width, height) {
        const col = Math.floor((coordX + width / 2) / this.cellSize);
        const row = Math.floor((coordY + height / 2) / this.cellSize);
        return {row, col};
    }

    buildPathGraph(player = null, enemies = []) {
        const mapData = this.grid;
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

        if (enemies && enemies.length > 0) {
            const aliveEnemies = enemies.filter(e => e.isAlive || e.isDying);
            aliveEnemies.forEach(enemy => {
                const pos = this.getCharacterPositionOnGrid(enemy.x, enemy.y, enemy.w, enemy.h);
                if (pos.row >= 0 && pos.row < rows && pos.col >= 0 && pos.col < cols) {
                    graph[pos.row][pos.col] = 0;
                }
            });
        }

        if (player) {
            const pos = this.getCharacterPositionOnGrid(player.x, player.y, player.w, player.h);
            if (pos.row >= 0 && pos.row < rows && pos.col >= 0 && pos.col < cols) {
                graph[pos.row][pos.col] = 1;
            }
        }

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

    getSpawns(symbol, playerPosition, characterWidth, characterHeight) {
        let spawns;

        if (symbol === CONFIG.PLAYER_SYMBOL) {
            spawns = this.playerSpawns;
        } else if (symbol === CONFIG.TARGET_SYMBOL) {
            const now = performance.now();
            this.diedTargets = this.diedTargets.filter(d => now - d.time < RESPAWN_INTERVAL);
            spawns = this.targetSpawns;
        } else if (symbol === CONFIG.ENEMY_SYMBOL) {
            spawns = this.enemySpawns;
        }

        // Защита от спавна в клетке игрока
        if (symbol !== CONFIG.PLAYER_SYMBOL && playerPosition) {
            const playerPosIndex = this.getCharacterPositionOnGrid(
                playerPosition.x, playerPosition.y, playerPosition.w, playerPosition.h
            );

            spawns = spawns.filter(spawn => {
                const spawnPosIndex = this.getCharacterPositionOnGrid(
                    spawn.x, spawn.y, characterWidth, characterHeight
                );
                return !(spawnPosIndex.row === playerPosIndex.row && spawnPosIndex.col === playerPosIndex.col);
            });
        }

        return spawns;
    }

    findFreeSpawn(symbol, playerPosition, characterWidth, characterHeight) {
        const spawns = this.getSpawns(symbol, playerPosition, characterWidth, characterHeight);

        let freePlaces;

        if (symbol === CONFIG.TARGET_SYMBOL) {
            freePlaces = spawns.filter((place, index) =>
                place.isFree && !this.diedTargets.some(d => d.index === index)
            );
        } else {
            freePlaces = spawns.filter((place) => place.isFree);
        }

        if (freePlaces.length === 0 && this.diedTargets.length > 0) {
            this.diedTargets = [];
            freePlaces = spawns.filter(place => place.isFree);
        }

        if (freePlaces.length > 0) {
            const randomIndex = Math.floor(Math.random() * freePlaces.length);
            freePlaces[randomIndex].isFree = false;
            return freePlaces[randomIndex];
        }

        spawns.forEach((place) => {
            place.isFree = true;
        });

        spawns[0].isFree = false;
        return spawns[0];
    }

    loadLevel(levelString) {
        this.playerSpawns = [];
        this.targetSpawns = [];
        this.enemySpawns = [];
        this.grid = [];

        const lines = levelString.trim().split('\n');
        this.height = lines.length * this.cellSize;
        this.width = lines[0].trim().length * this.cellSize;

        for (let row = 0; row < lines.length; row++) {
            const line = lines[row].trim();
            this.grid[row] = [];

            for (let col = 0; col < line.length; col++) {
                const char = line[col];
                const x = col * this.cellSize;
                const y = row * this.cellSize;

                this.grid[row][col] = char;

                switch (char) {
                    case CONFIG.WALL_SYMBOL:
                        this.walls.push({x, y, w: this.cellSize, h: this.cellSize});
                        break;
                    case CONFIG.BOX_SYMBOL:
                        this.boxes.push({x, y, w: this.cellSize, h: this.cellSize});
                        break;
                    case CONFIG.PLAYER_SYMBOL:
                        this.playerSpawns.push({
                            x: x + (this.cellSize - this.playerSize) / 2,
                            y: y + (this.cellSize - this.playerSize) / 2,
                            isFree: true
                        });
                        break;
                    case CONFIG.TARGET_SYMBOL:
                        this.targetSpawns.push({
                            x: x + (this.cellSize - this.playerSize) / 2,
                            y: y + (this.cellSize - this.playerSize) / 2,
                            isFree: true
                        });
                        break;
                    case CONFIG.ENEMY_SYMBOL:
                        this.enemySpawns.push({
                            x: x + (this.cellSize - this.playerSize) / 2,
                            y: y + (this.cellSize - this.playerSize) / 2,
                            isFree: true
                        });
                        break;
                }
            }
        }
    }

    isSolidPoint(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);

        if (!this.grid[row] || !this.grid[row][col]) return true;

        const cell = this.grid[row][col];
        return cell === CONFIG.WALL_SYMBOL || cell === CONFIG.BOX_SYMBOL;
    }

    draw(ctx, assets, cameraX, cameraY, canvasWidth, canvasHeight, zoom) {
        const viewWidth = canvasWidth / zoom;
        const viewHeight = canvasHeight / zoom;

        const startCol = Math.max(0, Math.floor((cameraX - viewWidth / 2) / this.cellSize));
        const endCol = Math.min(this.grid[0].length - 1, Math.ceil((cameraX + viewWidth / 2) / this.cellSize));
        const startRow = Math.max(0, Math.floor((cameraY - viewHeight / 2) / this.cellSize));
        const endRow = Math.min(this.grid.length - 1, Math.ceil((cameraY + viewHeight / 2) / this.cellSize));


        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const x = col * this.cellSize;
                const y = row * this.cellSize;
                const cell = this.grid[row][col];

                ctx.drawImage(assets.floor, x, y, this.cellSize, this.cellSize);

                if (cell === CONFIG.WALL_SYMBOL) {
                    ctx.drawImage(assets.wall, x, y, this.cellSize, this.cellSize);
                } else if (cell === CONFIG.BOX_SYMBOL) {
                    ctx.drawImage(assets.box, x, y, this.cellSize, this.cellSize);
                }
            }
        }
    }

    checkCollision(rect, enemies = [], targets = []) {
        const startCol = Math.floor(rect.x / this.cellSize);
        const endCol = Math.floor((rect.x + rect.w) / this.cellSize);
        const startRow = Math.floor(rect.y / this.cellSize);
        const endRow = Math.floor((rect.y + rect.h) / this.cellSize);

        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                if (!this.grid[row] || !this.grid[row][col]) return true;

                const cell = this.grid[row][col];
                if (cell === CONFIG.WALL_SYMBOL || cell === CONFIG.BOX_SYMBOL) {
                    return true;
                }
            }
        }

        for (let target of targets) {
            if (this.isIntersecting(rect, target)) return true;
        }

        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if ((enemy.isAlive || enemy.isDying) && this.isIntersecting(rect, enemy)) return true;
        }

        return false;
    }

    isIntersecting(r1, r2) {
        return r1.x < r2.x + r2.w &&
            r1.x + r1.w > r2.x &&
            r1.y < r2.y + r2.h &&
            r1.y + r1.h > r2.y;
    }
}