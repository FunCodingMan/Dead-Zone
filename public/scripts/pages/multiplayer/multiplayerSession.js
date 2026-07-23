import { AssetManager } from "../../utils/AssetManager.js";
import { Game} from "../../core/Game.js";
import {initPause, togglePauseUI} from "../../ui/Pause.js";
import { Network } from "../../utils/Network.js";
import {MultiplayerTestMode} from "../../multiplayer/MultiplayerTestMode.js";

const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const host = window.location.host;
const wsUrl = `${protocol}//${host}/ws/`;

const network = new Network(wsUrl);

const screens = {
    lobbyMenu: document.getElementById('screen-lobby-menu'),
    createRoom: document.getElementById('screen-create-room'),
    joinRoom: document.getElementById('screen-join-room'),
    room: document.getElementById('screen-room'),
    game: document.getElementById('screen-game'),
    gameOver: document.getElementById('screen-game-over')
};

const canvas = document.getElementById('gameCanvas');
const  assetManager = new AssetManager();
let game = null;
const assetsPromise = assetManager.loadAll();


initPause({
    onResume: () => game && game.togglePause(),
    onRestart: () => {
        if (game) {
            game.start(MultiplayerTestMode, network);
            canvas.focus();
            if (game.isPaused) game.togglePause();
            togglePauseUI(false);
        }
    },
    onExitToMenu: () => {
        if (game) game.stop();
        togglePauseUI(false);

        network.send('exit-room', {});
        showScreen('lobbyMenu');
    }
});

function showScreen(name) {
    Object.values(screens).forEach(el => el.classList.add('hidden'));
    screens[name].classList.remove('hidden');
}

const roomIdSpan = document.getElementById('roomId-span');
const playerList = document.getElementById('players-list');
const readyBtn = document.getElementById('ready-btn');
const curCountPlayers = document.getElementById('cur-players-count');
const maxCountPlayers = document.getElementById('max-players-count');
const inputRoomId = document.getElementById('input-room-id');
const joinErrorMessage = document.getElementById('join-error-message');
const startGameBtn = document.getElementById('start-game-btn');
const fogToggle = document.getElementById('fog-toggle');
const labelFogToggle = document.getElementById('label-fog-toggle');

let isReady = false;
let currentRoomId = null;

function renderPlayersList(players) {
    playerList.innerHTML = '';
    if (players.length === 0) {
        playerList.innerHTML = '<p>Ожидание сервера...</p>';
        return;
    }
    players.forEach((player) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item';
        const status = player.isReady ? 'ready' : 'waiting';
        const statusText = player.isReady ? 'ГОТОВ' : 'НЕ ГОТОВ';
        const hostIcon = player.isHost ? ' 👑' : '';
        playerDiv.innerHTML = `
            <span class="player-name">${player.nickname}${hostIcon}</span>
            <span class="player-status ${status}">${statusText}</span>
        `;
        playerList.appendChild(playerDiv);
    });
}

network.on('stateRoom', (payload) => {
    currentRoomId = payload.roomId;
    roomIdSpan.textContent = currentRoomId;
    curCountPlayers.textContent = payload.countUsers;
    maxCountPlayers.textContent = payload.maxCountUsers;
    renderPlayersList(payload.users);

    fogToggle.checked = payload.isFogEnabled;

    if (payload.amIHost) {
        startGameBtn.classList.remove('hidden');
        fogToggle.disabled = false;
        labelFogToggle.classList.remove('disabled');

        const isEveryoneReady = payload.users.every(u => u.isReady);

        if (isEveryoneReady) {
            startGameBtn.classList.remove('disabled');
            startGameBtn.disabled = false;
        } else {
            startGameBtn.classList.add('disabled');
            startGameBtn.disabled = true;
        }
    } else {
        startGameBtn.classList.add('hidden');
        fogToggle.disabled = true;
        labelFogToggle.classList.add('disabled');
    }
    if (screens.game.classList.contains('hidden')) {
        showScreen('room');
    }
});

startGameBtn.addEventListener('click', () => {
    if (!startGameBtn.disabled) {
        network.send('start-game', {});
    }
});
fogToggle.addEventListener('change', (e) => {
    const isFogOn = fogToggle.checked === true;
    network.send('toggle-fog', { isEnabled: isFogOn});
});

network.on('join-error', (payload) => {
    joinErrorMessage.textContent = payload.message;
    joinErrorMessage.style.display = 'block';
});

network.on('start-game',  async(payload) => {
    console.log('ИГРА НАЧАЛАСЬ!');

    const assets = await assetsPromise;

    showScreen('game');


    if (!game) {
        game = new Game(canvas, assets, togglePauseUI);
    }
    canvas.focus();

    game.start(MultiplayerTestMode, network);

    if (game.currentMode) {
        game.currentMode.isFogOfWarEnabled = payload.isFogEnabled;
    }

    if (game.isPaused) {
        game.togglePause();
    } else {
        togglePauseUI(false);
    }
});

network.on('game-over', (payload) => {
    console.log('МАТЧ ОКОНЧЕН!', payload);
    if (game) {
        game.stop();
        game.isGameEnded = true;
        togglePauseUI(false);
    }

    const tbody = document.getElementById('end-game-stats-body');
    tbody.innerHTML = '';

    payload.stats.forEach((s, index) => {
        const color = index === 0 ? '#ffd700' : '#ffffff';
        const fontWeight = index === 0 ? 'bold' : 'normal';

        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #555';
        tr.style.color = color;
        tr.style.fontWeight = fontWeight;

        tr.innerHTML = `
            <td class="table-title">${s.nickname}</td>
            <td class="table-title">${s.kills}</td>
            <td class="table-title">${s.deaths}</td>
        `;
        tbody.appendChild(tr);
    });

    showScreen('gameOver');
});


document.querySelector('.btn-createRoom').addEventListener('click', () => {
    isReady = false;
    readyBtn.textContent = 'ГОТОВ';
    network.send('create-room', {});
});

document.querySelector('.btn-joinRoom').addEventListener('click', () => {
    joinErrorMessage.style.display = 'none';
    inputRoomId.value = '';
    showScreen('joinRoom');
});

document.querySelectorAll('.btn-back-to-lobby').forEach(btn => {
    btn.addEventListener('click', () => showScreen('lobbyMenu'));
});

document.querySelector('.btn-exit-to-mode-selection').addEventListener('click', () => {
    network.disconnect();
    window.location.href = '/mode-selection';
});

document.getElementById('btn-submit-join').addEventListener('click', (e) => {
    e.preventDefault();
    const roomId = inputRoomId.value.trim();
    if (!roomId) return;
    isReady = false;
    readyBtn.textContent = 'ГОТОВ';
    network.send('join-room', { roomId });
});

readyBtn.addEventListener('click', () => {
    isReady = !isReady;
    readyBtn.textContent = isReady ? 'НЕ ГОТОВ' : 'ГОТОВ';
    network.send('ready', { isReady });
});

document.getElementById('btn-exit-room').addEventListener('click', () => {
    network.send('exit-room', {});
    isReady = false;
    readyBtn.textContent = 'ГОТОВ';
    showScreen('lobbyMenu');
});

document.getElementById('btn-exit-to-lobby-from-stats').addEventListener('click', () => {
    network.send('exit-room', {});
    isReady = false;
    readyBtn.textContent = 'НЕ ГОТОВ';
    showScreen('lobbyMenu');
});

network.connect();
showScreen('lobbyMenu');

