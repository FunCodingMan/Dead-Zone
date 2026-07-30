import { CONFIG } from "../core/Config.js";
import {Character} from "./Character.js";

const TARGET_SIZE = 48;

export class Target extends Character{
    constructor(map, playerPosition) {
        const spawn = map.findFreeSpawn(CONFIG.TARGET_SYMBOL, playerPosition, TARGET_SIZE, TARGET_SIZE);
        const spawnIndex = map.targetSpawns.indexOf(spawn);
        super(spawn, TARGET_SIZE, TARGET_SIZE, spawnIndex, null);
    }

}
