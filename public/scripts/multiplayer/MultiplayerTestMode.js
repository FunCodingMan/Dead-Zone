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
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws/`;
        super(engine, wsUrl);
    }

    init() {
        this.engine.map = new Map();
        this.engine.map.loadLevel(testMapData);

        super.init();
    }
    drawUI(ctx, canvas) {

        super.drawUI(ctx, canvas);

        if  (this.network.connectionStatus !== 'connected') return;

        ctx.fillStyle = '#00FF00';
        ctx.font = '20px Arial';
        ctx.fillText("ОНЛАЙН-ТЕСТ", 20, 30);
        ctx.fillText(`Врагов в комнате: ${this.otherPlayers.size}`, 20, 60);
    }
}