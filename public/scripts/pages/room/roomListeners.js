import { Network } from "../../utils/Network.js";

const roomIdSpan = document.getElementById('roomId-span');
const playerList = document.getElementById('players-list');
const readyBtn = document.getElementById('ready-btn');
const btnExit = document.getElementById('btn-exit');
const curCountPlayers = document.getElementById('cur-players-count');
const maxCountPlayers = document.getElementById('max-players-count');

const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const host = window.location.host;
const wsUrl = `${protocol}//${host}/ws/`;

const network = new Network(wsUrl);

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('id');

let players = [];
let isReady = false;

if (!roomId) {
    window.location.href = '/mode-selection/multiplayer';
    throw new Error("Редирект: отсутствует ID комнаты.");
}

roomIdSpan.textContent = roomId;

function renderPlayersList() {
    playerList.innerHTML = '';

    if (players.length === 0) {
        playerList.innerHTML = '<p>Ождиание сервера...</p>';
    }

    players.forEach((player) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item';

        const status = player.isReady ? 'ready' : 'waiting';
        const statusText = player.isReady ? 'ГОТОВ' : 'НЕ ГОТОВ';

        playerDiv.innerHTML = `
            <span class="player-name">${player.nickname}</span>
            <span class="player-status ${status}">${statusText}</span>
        `;

        playerList.appendChild(playerDiv);
    });
}

network.on('stateRoom', (payload) => {
    players = payload.users;
    curCountPlayers.textContent = payload.countUsers;
    maxCountPlayers.textContent = payload.maxCountUsers;
    renderPlayersList();
});

network.on('start-game', () => {
    console.log('ИГРА НАЧАЛАСЬ!');
});

network.connect();

const checkConnection = setInterval(() => {
    if (network.connectionStatus === 'connected') {
        clearInterval(checkConnection);

        network.send('join-room', {roomId: roomId});
    }
}, 50);

readyBtn.addEventListener('click', () => {
    isReady = !isReady;
    readyBtn.textContent = isReady ? 'ГОТОВ': 'НЕ ГОТОВ';

    network.send('ready', { isReady: isReady });
});

btnExit.addEventListener('click', () => {
    network.send('exit-room', {});

    network.disconnect();

    window.location.href = `/mode-selection/multiplayer`;
});

