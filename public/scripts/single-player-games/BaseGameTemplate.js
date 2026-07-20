import { ClassSelector } from "../core/ClassSelector.js";
import { classes } from "../core/ClassesList.js";
import { Map } from "../core/Map.js";
import { CONFIG } from "../core/Config.js";
import { Soldier } from "../entities/ClassesLogic/Soldier.js";
import { Flamethrower } from "../entities/ClassesLogic/Flamethrower.js";

export class BaseGameTemplate {
    constructor(engine) {
        this.engine = engine;
        this.isInitializationReady = false;
    }

    async init() {
        const selector = new ClassSelector(classes);
        this.selectedClass = await selector.show();
        
        this.engine.map = new Map();
        this.engine.map.loadLevel(this.getLevelData());
        
        switch (this.selectedClass.className) {
            case CONFIG.SOLDIER_CLASS_NAME: 
                this.engine.player = new Soldier(this.engine.map, this.engine.input, this.selectedClass);
                break;
            case CONFIG.FLAMETHROWER_CLASS_NAME: 
                this.engine.player = new Flamethrower(this.engine.map, this.engine.input, this.selectedClass);
                break;
        }
        

        this.engine.player.bloodManager = this.engine.bloodManager;
        
        await this.setupMode();
        
        this.isInitializationReady = true;
    }

    setupMode() {

    }

    getLevelData() {

    }

    update () {

    }
    
    drawUI(ctx, canvas) {

    }

    destroy() {

    }
}