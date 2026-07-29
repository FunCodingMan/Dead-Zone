import { ClassSelector } from "../core/ClassSelector.js";
import { classes } from "../core/ClassesList.js";
import { Map } from "../core/Map.js";
import { CONFIG } from "../core/Config.js";
import { Soldier } from "../entities/ClassesLogic/Soldier.js";
import { Flamethrower } from "../entities/ClassesLogic/Flamethrower.js";
import { Scientist } from "../entities/ClassesLogic/Scientist.js";

export class BaseGameTemplate {
    constructor(engine) {
        this.engine = engine;
        this.isInitializationReady = false;
    }


    async init() {
        this.engine.isGameEnded = false;

        await this.setupMap();
        await this.setupPlayer();
        await this.setupMode();

        this.isInitializationReady = true;
    }

    async setupMap() {
        this.engine.map = new Map();
        this.engine.map.loadLevel(this.getLevelData());
    }

    async setupPlayer() {
        const selector = new ClassSelector(classes);
        this.selectedClass = await selector.show();

        this.engine.player = this.createPlayerInstance();
        this.engine.player.spotManager = this.engine.spotManager;
    }

    createPlayerInstance() {
        switch (this.selectedClass.className) {
            case CONFIG.SOLDIER_CLASS_NAME:
                return new Soldier(this.engine.map, this.engine.input, this.selectedClass);
            case CONFIG.FLAMETHROWER_CLASS_NAME:
                return new Flamethrower(this.engine.map, this.engine.input, this.selectedClass);
            case CONFIG.SCIENTIST_CLASS_NAME:
                return new Scientist(this.engine.map, this.engine.input, this.selectedClass);
            default:
                return new Soldier(this.engine.map, this.engine.input, this.selectedClass);
        }
    }

    setupMode() {

    }

    getLevelData() {

        return "";
    }

    update(dt) {

    }

    drawUI(ctx, canvas) {

    }

    destroy() {

    }
}