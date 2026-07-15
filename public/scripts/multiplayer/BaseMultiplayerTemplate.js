import { BaseGameTemplate } from "../single-player-games/BaseGameTemplate.js";
import { Network } from "../utils/Network.js";
import { Player } from "../entities/Player.js";
import { RemotePlayer } from "../entities/RemotePlayer.js";


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

        this.network.on('state', (data) => {
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

        if (!this.localUserId) this.localUserId = me.user_id;

        this.engine.player.shotsAmount = me.count_bullets;
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

    // Заглушка, пока нет json 'spawn'
    spawnByFirstState(data) {
        this.engine.player = new Player(this.engine.map, this.engine.input);
        this.engine.player.x = data.me.x || 100;
        this.engine.player.y = data.me.y || 100;
        this.engine.player.isAlive = true;
        this.localUserId = data.me.user_id;
        this.onPlayerSpawned(data.me);
    }

    syncWithServer(data) {
        if (!data) return;

        if (data.me && (!this.engine.player || !this.engine.player.isAlive)) {
            this.spawnByFirstState(data);
        }

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

        if (input.isMouseDown && !this.engine.player.isReloading && this.engine.player.shotsAmount > 0) {
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
        const activeKeys = [];

        if (input.isPressed('KeyW') || input.isPressed('ArrowUp')) activeKeys.push('w');
        if (input.isPressed('KeyS') || input.isPressed('ArrowDown')) activeKeys.push('s');
        if (input.isPressed('KeyA') || input.isPressed('ArrowLeft')) activeKeys.push('a');
        if (input.isPressed('KeyD') || input.isPressed('ArrowRight')) activeKeys.push('d');

        this.network.send('move', {
            keys: activeKeys,
            angle: this.engine.player.angle
        });
    }

    draw(ctx) {
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