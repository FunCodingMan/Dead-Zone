import { BaseGameTemplate } from "../single-player-games/BaseGameTemplate.js";
import { Network } from "../utils/Network.js";
import { Player } from "../entities/Player.js";
import { RemotePlayer } from "../entities/RemotePlayer.js";


const DATA_SENDING_MOVE_INTERVAL_MS = 33;
const SHOOT_COOLDOWN_MS = 150;
const BORDER_DIFF_BETWEEN_CLIENT_AND_SERVER = 30;
const LERP_COOF_BETWEEN_CLIENT_AND_SERVER = 0.1;
const VISIBILITY_RADIUS = 800;
const FOV_ANGLE = Math.PI * 0.25;
const RAYS_COUNT = 120;
const RAY_STEP = 1;
export class BaseMultiplayerTemplate extends BaseGameTemplate {
    constructor(engine, network) {
        super(engine);

        this.network = network;

        this.otherPlayers = new Map();

        this.lastMoveSendTime = 0;

        this.lastShotSendTime = 0;

        this.localUserId = null;

        this.isFogOfWarEnabled = true;

        this.reloadPacketSent = false;

        this.boundOnSpawn = (data) => this.handleSpawn(data);
        this.boundOnState = (data) => this.syncWithServer(data);
        this.boundOnShotFired = (data) => this.handleShotFired(data);
    }

    init() {
        this.setupNetworkListeners();
    }

    setupNetworkListeners() {
        this.network.on('spawn', this.boundOnSpawn);
        this.network.on('state', this.boundOnState);
        this.network.on('shotFired', this.boundOnShotFired);
    }
    handleSpawn(data) {
        this.engine.player = new Player(this.engine.map, this.engine.input);
        this.engine.player.x = data.x;
        this.engine.player.y = data.y;
        this.engine.player.isAlive = true;
        this.onPlayerSpawned(data);
    }

    handleShotFired(payload) {
        if (payload.shooterId === this.localUserId) return;

        const remoteShooter = this.otherPlayers.get(payload.shooterId);
        if (remoteShooter) {
            remoteShooter.spawnNetworkBullet(payload.startX, payload.startY, payload.angle);
            remoteShooter.angle = payload.angle;
            remoteShooter.isShooting = true;
            setTimeout(() => { remoteShooter.isShooting = false; }, 100);
        }
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

    spawnByFirstState(data) {
        this.engine.player = new Player(this.engine.map, this.engine.input);
        this.engine.player.x = data.me.x || 100;
        this.engine.player.y = data.me.y || 100;
        this.engine.player.isAlive = true;
        this.engine.player.isMultiplayer = true;
        this.localUserId = data.me.user_id;
        this.onPlayerSpawned(data.me);
    }

    syncWithServer(data) {
        if (!data) return;

        if (data.me && !this.engine.player) {
            this.spawnByFirstState(data);
        }

        if (data.me && this.engine.player) {
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

    checkSendReloadData() {
        const player = this.engine.player;
        console.log('RELOAD')
        if (player.isReloading && !this.reloadPacketSent) {
            console.log('RELOAD: TRUE');
            this.network.send('reload', {});
            this.reloadPacketSent = true;
        } else if (!player.isReloading) {
            this.reloadPacketSent = false;
        }
    }

    update() {
        if (!this.engine.player) return;

        if (this.engine.player.hitpoints <= 0) {
            if (this.engine.player.isAlive) {
                this.engine.player.isAlive = false;
                this.engine.player.isDying = true;
                this.deathTime = performance.now();
            }
            return;
        }

        if (!this.engine.player.isAlive && this.engine.player.hitpoints > 0) {
            this.engine.player.isAlive = true;
            this.engine.player.isDying = false;
            this.deathTime = 0;
        }

        const now = performance.now();
        const input = this.engine.input;

        this.checkSendMoveData(now);


        this.otherPlayers.forEach(remotePlayer => {
            remotePlayer.updateInterpolation(0.2, this.engine.map);
        });

        this.checkSendShotData(now, input);

        this.checkSendReloadData();
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
                enemy.draw(
                    ctx,
                    this.engine.assets.soldier,
                    this.engine.assets.bullet,
                    this.engine.assets.shot1,
                    this.engine.assets.shot2
                );
            }
        });
        this.drawFogOfWar(ctx);
    }

    drawFogOfWar(ctx) {
        if (!this.isFogOfWarEnabled) return;

        const player = this.engine.player;
        if (!player || !player.isAlive) return;

        const centerX = player.x + player.w / 2;
        const centerY = player.y + player.h / 2;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.beginPath();

        ctx.rect(centerX - 4000, centerY - 4000, 8000, 8000);

        ctx.moveTo(centerX, centerY);
        const startAngle = player.angle - FOV_ANGLE;
        for (let i = 0; i <= RAYS_COUNT; i++) {
            const curAngle = startAngle + (i / RAYS_COUNT) * (FOV_ANGLE * 2);
            const point = this.createVisionRay(centerX, centerY, curAngle);
            ctx.lineTo(point.x, point.y);
        }
        ctx.lineTo(centerX, centerY);

        ctx.fill('evenodd');
        ctx.restore();
    }
    drawDeath(ctx, canvas) {
        ctx.save();

        ctx.fillStyle = 'rgba(150, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ВЫ УБИТЫ', canvas.width / 2, canvas.height / 2 - 20);

        const secondsLeft = Math.max(0, 5 - (performance.now() - this.deathTime) / 1000).toFixed(1);

        ctx.font = '20px Arial';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(`Возрождение через ${secondsLeft} сек...`, canvas.width / 2, canvas.height / 2 + 30);

        ctx.restore();
    }

    drawConnecting(ctx, canvas) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let text = 'ПОДКЛЮЧЕНИЕ К СЕРВЕРУ...';
        if (this.network.lastDisconnectTime) {
            const elapsedSeconds = Math.floor((performance.now() - this.network.lastDisconnectTime) / 1000);
            if (this.network.connectionStatus === 'connecting') {
                text = `ПОПЫТКА ПЕРЕПОДКЛЮЧЕНИЯ... (${elapsedSeconds} сек)`;
            } else {
                text = `ПОТЕРЯНО СОЕДИНЕНИЕ. ОЖИДАНИЕ... (${elapsedSeconds} сек)`;
            }

            ctx.font = '20px Arial';
            ctx.fillStyle = '#aaaaaa';
            ctx.fillText('Нажмите ESC, чтобы выйти в меню', canvas.width / 2, canvas.height / 2 + 50);

            ctx.font = 'bold 32px Arial';
            ctx.fillStyle = '#ff4444';
        }

        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        ctx.restore();
    }

    drawUI(ctx, canvas) {
        if (this.network.connectionStatus !== 'connected') {
            this.drawConnecting(ctx, canvas);
            return;
        }

        if (this.engine.player && !this.engine.player.isAlive) {
            this.drawDeath(ctx, canvas);
        }
    }

    createVisionRay(startX, startY, angle) {
        let curX = startX;
        let curY = startY;

        const dx = Math.cos(angle) * RAY_STEP;
        const dy = Math.sin(angle) * RAY_STEP;

        let distance = 0;

        while (distance < VISIBILITY_RADIUS) {
            curX += dx;
            curY += dy;
            distance += RAY_STEP;

            const check = {x: curX - 1, y: curY -1, w: 2, h: 2};

            if (this.engine.map.checkCollision(check, [], [])) {
                return {x: curX, y: curY};
            }
        }
        return { x: curX, y: curY };
    }

    destroy() {
        this.network.off('spawn', this.boundOnSpawn);
        this.network.off('state', this.boundOnState);
        this.otherPlayers.clear();
    }


}