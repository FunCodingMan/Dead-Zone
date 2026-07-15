import { BaseMultiplayerTemplate } from "./BaseMultiplayerTemplate.js";
import { Map } from '../core/Map.js';

// Простая тестовая карта (или возьми любую существующую из TrainingMode)
const testMapData = `
################
#P            P#
#  ####  ####  #
#  #        #  #
#  ####  ####  #
#P            P#
################
`;

export class MultiplayerTestMode extends BaseMultiplayerTemplate {
    constructor(engine) {
        super(engine, 'ws://localhost/ws/');
    }

    init() {
        this.engine.map = new Map();
        this.engine.map.loadLevel(testMapData);

        super.init();
    }
    drawUI(ctx, canvas) {
        super.drawUI(ctx, canvas);

        ctx.fillStyle = '#00FF00';
        ctx.font = '20px Arial';
        ctx.fillText("ОНЛАЙН-ТЕСТ", 20, 30);
        ctx.fillText(`Врагов в комнате: ${this.otherPlayers.size}`, 20, 60);
    }
}