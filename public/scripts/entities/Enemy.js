import { CONFIG } from "../core/Config.js";
import {Character} from "./Character.js";

const ENEMY_WIDTH = 48;
const ENEMY_HEIGHT = 48;
const SPEED = 2;
const ATTACK_DISTANCE = 60;
const DAMAGE = 10;
const DAMAGE_COOLDOWN = 100;

export class Enemy extends Character{
    constructor(map, playerPosition) {
        const spawn = super(map.findFreeSpawn(CONFIG.ENEMY_SYMBOL, playerPosition, ENEMY_WIDTH, ENEMY_HEIGHT), ENEMY_WIDTH, ENEMY_HEIGHT, null);
        this.speed = SPEED;
        this.attackDistance = ATTACK_DISTANCE;
        this.damage = DAMAGE;
        this.damageCooldown = DAMAGE_COOLDOWN;
    }
}