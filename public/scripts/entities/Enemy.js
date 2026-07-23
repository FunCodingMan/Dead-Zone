import { CONFIG } from "../core/Config.js";
import {Character} from "./Character.js";

const ENEMY_WIDTH = 48;
const ENEMY_HEIGHT = 48;
const SPEED = 2;
const ATTACK_DISTANCE = 60;
const DAMAGE = 10;
const DAMAGE_COOLDOWN = 100;

const HITPOINTS = 100;

export class Enemy extends Character{
    constructor(map, playerPosition) {
        const spawn = map.findFreeSpawn(CONFIG.ENEMY_SYMBOL, playerPosition, ENEMY_WIDTH, ENEMY_HEIGHT);
        const spawnIndex = map.enemySpawns.indexOf(spawn);
        super(
            spawn, ENEMY_WIDTH, ENEMY_HEIGHT, spawnIndex, null, HITPOINTS
        );
        this.speed = SPEED;
        this.attackDistance = ATTACK_DISTANCE;
        this.damage = DAMAGE;
        this.damageCooldown = DAMAGE_COOLDOWN;
        this.hitpoints = HITPOINTS;
    }
}
