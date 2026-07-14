import { BaseGameTemplate } from "../single-player-games/BaseGameTemplate";
import { Network } from "../utils/Network";
import { Player } from "../entities/Player";
import { RemotePlayer } from "../entities/RemotePlayer";
import { Character } from "../entities/Character";

const DATA_SENDING_MOVE_INTERVAL_MS = 33;
const SHOOT_COOLDOWN_MS = 150;
const BORDER_DIFF_BETWEEN_CLIENT_AND_SERVER = 30;
const LERP_COOF_BETWEEN_CLIENT_AND_SERVER = 0.1;

export class BaseMultiplayerTemplate extends BaseGameTemplate {
    constructor(engine, url) {
        super(engine);

        this.network = new Network(url);

        this.otherPlayers = new Map();

        this.lastMoveSendTime = 0;

        this.lastShotSendTime = 0;

        this.localUserId = null;
    }

    init() {
        this.setupNetworkListeners();
        this.network.connect();
    }

    setupNetworkListeners() {
        this.network.on('spawn', (data) => {
            this.engine.player = new Player(this.engine.map, this.engine.input);
            this.engine.player.x = data.x;
            this.engine.player.y = data.y;
            this.engine.player.isAlive = true;
            this.onPlayerSpawned(data);
        });

        this.network.on('stats', (data) => {
            this.syncWithServer(data);
        });
    }

    onPlayerSpawned() {

    }

    teleportPlayer(x, y) {
        if (!this.engine.player) return;

        this.engine.player.x = x;
        this.engine.player.y = y;
    }

    syncPlayer(data) {
        const me = data.me;

        if (!this.localUserId) this.localUserId = me.userId;

        this.engine.player.shotsAmount = me.countBullets;
        this.engine.player.hitpoints = me.health;

        const dist = Math.hypot(this.engine.player.x - me.x, this.engine.player.y - me.y);

        if (dist > BORDER_DIFF_BETWEEN_CLIENT_AND_SERVER) {
            this.teleportPlayer(me.x, me.y);
        } else {
            this.engine.player.x += (me.x - this.engine.player.x) * LERP_COOF_BETWEEN_CLIENT_AND_SERVER;
            this.engine.player.y += (me.y - this.engine.player.y) * LERP_COOF_BETWEEN_CLIENT_AND_SERVER;
        }
    }

    syncRemotePlayers(data) {
        const others = data.others || {};
        const activePlayers = new Set();

        for (const [id, state] of Object.entries(others)) {
            activePlayers.add(id);

            if (this.otherPlayers.has(id)) {
                const remotePlayer = this.otherPlayers.get(id);
                remotePlayer.updateServerState(state);
            } else {
                const newRemotePlayer = new RemotePlayer(id, state.x, state.y);

                newRemotePlayer.updateServerState(state);

                newRemotePlayer.isAlive = true;

                this.otherPlayers.set(id, newRemotePlayer);
            }
        }
        return activePlayers;
    }

    removePlayersWhoHasLeft(activePlayers) {
        for (const [id, state] of this.otherPlayers) {
            if (!activePlayers.has(id)) {
                this.otherPlayers.delete(id);
            }
        }
    }

    syncWithServer(data) {
        if (!data) return;

        if (data.me && this.engine.player && this.engine.player.isAlive) {
            this.syncPlayer(data);
        }

        const activePlayers = this.syncRemotePlayers(data);

        this.removePlayersWhoHasLeft(activePlayers);

    }

    checkSendMoveData(now) {
        if (now - this.lastMoveSendTime >= DATA_SENDING_MOVE_INTERVAL_MS) {
            this.sendMoveData();
            this.lastMoveSendTime = now;
        }
    }

    checkSendShotData(now, input) {
        if (now - this.lastShotSendTime < SHOOT_COOLDOWN_MS) return;

        if (input.isMouseDown && !this.engine.player.isReloading && this.engine.shotsAmount > 0) {
            this.network.send('shot', {angle: this.engine.player.angle});
            this.lastShotSendTime = now;
        }
    }

    checkSendReloadData(input) {
        if (input.isJustPressed('KeyR') && !this.engine.player.isReloading) {
            this.network.send('reload', {});
        }
    }

    update() {
        if (!this.engine.player || !this.engine.player.isAlive) return;

        const now = performance.now();
        const input = this.engine.input;

        this.checkSendMoveData(now);

        this.otherPlayers.forEach(remotePlayer => {
            remotePlayer.updateInterpolation(0.2);
        });

        this.checkSendShotData(now, input);

        this.checkSendReloadData(input);
    }



    sendMoveData() {
        const input = this.engine.input;

        this.network.send('move', {
            keyboard: {
                w: input.isPressed('KeyW') || input.isPressed('ArrowUp'),
                s: input.isPressed('KeyS') || input.isPressed('ArrowDown'),
                a: input.isPressed('KeyA') || input.isPressed('ArrowLeft'),
                d: input.isPressed('KeyD') || input.isPressed('ArrowRight')
            },
            angle: this.engine.player.angle
        });
    }

    drawUI(ctx, canvas) {
        this.otherPlayers.forEach((enemy) => {
            if (enemy.isAlive && enemy.hitpoints > 0) {
                enemy.draw(ctx, this.engine.assets.soldier);
            }
        });
    }

    destroy() {
        this.network.disconnect();
        this.otherPlayers.clear();
    }


}