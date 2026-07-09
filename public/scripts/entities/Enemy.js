import {Character} from "./Character.js";

const ENEMY_WIDTH = 28;
const ENEMY_HEIGHT = 48;

export class Enemy extends Character{
    constructor(map) {
        super(map.findFreeSpawn(), ENEMY_WIDTH, ENEMY_HEIGHT);
    }

}
