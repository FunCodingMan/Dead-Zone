import { Network } from "../../utils/Network.js";

const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const host = window.location.host;
const wsUrl = `${protocol}//${host}/ws/`;

const network = new Network(wsUrl);

const screens = {
    lobbyMenu: document.getElementById('screen-lobby-menu'),
    createRoom: document.getElementById('screen-create-room'),
    joinRoom: document.getElementById('screen-join-room'),
    room: document.getElementById('screen-room'),
};

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
        playerDiv.innerHTML = `
            <span class="player-name">${player.nickname}</span>
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
    showScreen('room');
});

network.on('join-error', (payload) => {
    joinErrorMessage.textContent = payload.message;
    joinErrorMessage.style.display = 'block';
});

network.on('start-game', () => {
    console.log('ИГРА НАЧАЛАСЬ!');
});


document.querySelector('.btn-createRoom').addEventListener('click', () => {
    isReady = false;
    readyBtn.textContent = 'НЕ ГОТОВ';
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
    readyBtn.textContent = 'НЕ ГОТОВ';
    network.send('join-room', { roomId });
});

readyBtn.addEventListener('click', () => {
    isReady = !isReady;
    readyBtn.textContent = isReady ? 'ГОТОВ' : 'НЕ ГОТОВ';
    network.send('ready', { isReady });
});

document.getElementById('btn-exit-room').addEventListener('click', () => {
    network.send('exit-room', {});
    isReady = false;
    showScreen('lobbyMenu'); // соединение НЕ рвём — мы всё ещё на той же SPA-странице
});

network.connect();
showScreen('lobbyMenu');