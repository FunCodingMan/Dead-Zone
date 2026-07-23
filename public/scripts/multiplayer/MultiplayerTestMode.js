import { BaseMultiplayerTemplate } from "./BaseMultiplayerTemplate.js";
import { Map } from '../core/Map.js';

const testMapData = `
###########################################################
#       #      #                       P                 P#
#  P    #      #                     #############        #
#       #      #                     #   BB     BB        #
#  P                                     BB           B   #
#                                    #BB   ########       #
#      B#      #                     ####B #      #       #
#       #  P   #                     #     #      #       #
#       ########      #######        #     #      ####### #
#  B B  #            #  P                          P      #
#  B B  #     P#BBBB##BBBBB ##########     #B      #      #
#       ########      #                     ########B     #
#B B                  #        P                    B     #
#B B  P #             #                      ####B        #
#########             #                    #    ########  #
#       ########     #######          BBBB##  B     #     #
#       #      #           #    P     BBBB##    P    #    #
#   B   #                                 ########   B    #
#       #      #           #                         P B  #
####    #      ########B####B######B      #B         B    #
# P#    #    P B      B#  #        #      #BB   ##        #
#  #                          B    #  B B #     ##        #
#  ##  ###B#####   B   #  #        #  ####     ###B#####  #
#  # P    #           B#  #                 B         #   #
#         #        B  B#  #                 B   B     # P #
#         #  P BBBBBBBB#  #      P #       BBBBB  P   #   #
###########################################################
`;

const testMapData_ = `
################
#P            P#
#  ####  ####  #
#  #        #  #
#  ####  ####  #
#P            P#
################
`;

export class MultiplayerTestMode extends BaseMultiplayerTemplate {

    constructor(engine, network) {
        super(engine, network);
    }

    init() {
        this.engine.map = new Map();
        this.engine.map.loadLevel(testMapData);

        super.init();
    }
    drawUI(ctx, canvas) {
        super.drawUI(ctx, canvas);
        if  (this.network.connectionStatus !== 'connected') return;

        const uiScale = canvas.height / 1080;
        const enemiesCount = this.totalPlayers;

        ctx.fillStyle = '#00FF00';
        ctx.textAlign = 'left';

        ctx.font = `bold ${Math.floor(35 * uiScale)}px Arial`;
        ctx.fillText("ОНЛАЙН-ТЕСТ", 30 * uiScale, 50 * uiScale);

        ctx.font = `${Math.floor(25 * uiScale)}px Arial`;
        ctx.fillText(`Игроков в комнате: ${enemiesCount}`, 30 * uiScale, 90 * uiScale);

        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = Math.floor(this.timeLeft % 60).toString().padStart(2, '0');
        const timeText = `${minutes}:${seconds}`;

        ctx.fillStyle = this.timeLeft <= 10 ? '#ff4444' : '#ffffff';
        ctx.font = `bold ${Math.floor(45 * uiScale)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(`ВРЕМЯ: ${timeText}`, canvas.width / 2, 60 * uiScale);
    }
}