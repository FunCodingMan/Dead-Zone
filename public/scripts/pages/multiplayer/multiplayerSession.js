import { AssetManager } from "../../utils/AssetManager.js";
import { Game} from "../../core/Game.js";
import {initPause, setPauseGameReference, togglePauseUI} from "../../ui/Pause.js";
import { Network } from "../../utils/Network.js";
import {MultiplayerTestMode} from "../../multiplayer/MultiplayerTestMode.js";

const MIN_MATCH_DURATION_S = 10;
const MAX_MATCH_DURATION_S = 3600;

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
const durationSelect = document.getElementById('duration-select');
const durationInput = document.getElementById('duration-input');
const modeSelect = document.getElementById('mode-select');
const teamSelectionControls = document.getElementById('team-selection-controls');
const teamButtons = document.querySelectorAll('.btn-team');
const roundBanner = document.getElementById('round-banner');
const roundBannerText = document.getElementById('round-banner-text');
const roundScoreRed = document.getElementById('round-score-red');
const roundScoreBlue = document.getElementById('round-score-blue');

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
        const teamClass = player.team ? player.team : 'none';
        playerDiv.innerHTML = `
            <span class="player-name ${teamClass}">${player.nickname}${hostIcon}</span>
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

    if (payload.matchDuration) {
        const isEditing = document.activeElement === durationInput || document.activeElement === durationSelect;

        if (!isEditing) {
            const standardValues = ["60", "120", "180", "300"];
            if (standardValues.includes(payload.matchDuration.toString())) {
                durationSelect.value = payload.matchDuration.toString();
                durationInput.classList.add('hidden');
                durationInput.value = payload.matchDuration;
            } else {
                durationSelect.value = 'custom';
                durationInput.classList.remove('hidden');
                durationInput.value = payload.matchDuration;
            }
        }
    }
    network.on('round_end', (payload) => {
        console.log('РАУНД ОКОНЧЕН!', payload);

        let text = 'НИЧЬЯ';
        roundBannerText.className = 'round-banner__text color-draw';

        if (payload.winnerTeam === 'RED' || payload.winnerTeam === 'red') {
            text = 'КРАСНЫЕ ВЫИГРАЛИ РАУНД';
            roundBannerText.className = 'round-banner__text color-red';
        } else if (payload.winnerTeam === 'BLUE' || payload.winnerTeam === 'blue') {
            text = 'СИНИЕ ВЫИГРАЛИ РАУНД';
            roundBannerText.className = 'round-banner__text color-blue';
        }

        roundBannerText.textContent = text;
        roundScoreRed.textContent = payload.scores.red || 0;
        roundScoreBlue.textContent = payload.scores.blue || 0;

        roundBanner.classList.remove('hidden');
    });

    network.on('round_start', () => {
        console.log('НОВЫЙ РАУНД НАЧАЛСЯ!');

        roundBanner.classList.add('hidden');
    });

    if (payload.modeType) {
        modeSelect.value = payload.modeType;

        if (payload.modeType === 'tdm' || payload.modeType === 'round_based') {
            teamSelectionControls.classList.remove('hidden');
        } else {
            teamSelectionControls.classList.add('hidden');
        }
    }
    renderPlayersList(payload.users);


    if (payload.amIHost) {
        startGameBtn.classList.remove('hidden');
        fogToggle.disabled = false;
        labelFogToggle.classList.remove('disabled');

        durationSelect.disabled = false;
        durationInput.disabled = false;
        modeSelect.disabled = false;

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
        durationSelect.disabled = true;
        durationInput.disabled = true;
        modeSelect.disabled = true;
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
durationSelect.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
        durationInput.classList.remove('hidden');
        durationInput.focus();
    } else {
        durationInput.classList.add('hidden');
        const selectedDuration = parseInt(e.target.value, 10);
        network.send('change-match-duration', { duration: selectedDuration });
    }
});

durationInput.addEventListener('change', (e) => {
    let selectedDuration = parseInt(e.target.value, 10);
    if (isNaN(selectedDuration) || selectedDuration < MIN_MATCH_DURATION_S) {
        selectedDuration = MIN_MATCH_DURATION_S;
        e.target.value = selectedDuration;
    } else if (selectedDuration > MAX_MATCH_DURATION_S) {
        selectedDuration = MAX_MATCH_DURATION_S;
        e.target.value = selectedDuration;
    }
    network.send('change-match-duration', { duration: selectedDuration });
});

modeSelect.addEventListener('change', (e) => {
    network.send('change-mode', { mode: e.target.value });
});

teamButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const team = e.target.getAttribute('data-team');
        network.send('switch-team', { team: team });
    });
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
    setPauseGameReference(game);

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

    const titleElement = document.querySelector('#screen-game-over .menu-title');


    if (payload.mode === 'tdm' || payload.mode === 'round_based') {
        let text = 'НИЧЬЯ';
        if (payload.winnerTeam === 'RED') text = '<span style="color:#ff4444">ПОБЕДА КРАСНЫХ</span>';
        if (payload.winnerTeam === 'BLUE') text = '<span style="color:#4444ff">ПОБЕДА СИНИХ</span>';
        titleElement.innerHTML = `${text}<br><span style="font-size:24px; color:#fff">КРАСНЫЕ ${payload.redScore} : ${payload.blueScore} СИНИЕ</span>`;
    } else {
        titleElement.innerHTML = `ПОБЕДИТЕЛЬ:<br><span style="color:#ffd700">${payload.winner}</span>`;
    }

    const tbody = document.getElementById('end-game-stats-body');
    tbody.innerHTML = '';

    payload.stats.forEach((s, index) => {
        let color = '#ffffff';
        let fontWeight = 'normal';

        if (payload.mode === 'tdm' || payload.mode === 'round_based') {
            if (s.team === 'red') color = '#ff4444';
            if (s.team === 'blue') color = '#4444ff';
        } else {
            if (index === 0) {
                color = '#ffd700';
                fontWeight = 'bold';
            }
        }

        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #555';
        tr.style.color = color;
        tr.style.fontWeight = fontWeight;

        tr.innerHTML = `
            <td class="table-title">${s.nickname}</td>
            <td class="table-title">${s.kills}</td>
            <td class="table-title">${s.deaths}</td>
            <td class="table-title">${s.kd}</td>
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

