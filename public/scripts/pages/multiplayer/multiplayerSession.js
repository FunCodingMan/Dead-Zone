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
    serversList: document.getElementById('screen-servers-list'),
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
const classSelectionToggle = document.getElementById('class-selection-toggle');
const labelClassSelectionToggle = document.getElementById('label-class-selection-toggle');
const classSelect = document.getElementById('class-select');
const gameOverTitle = document.getElementById('game-over-title');
const gameOverSubtitle = document.getElementById('game-over-subtitle');
const stayInRoomBtn = document.getElementById('btn-stay-in-room');
const leaveRoomBtn = document.getElementById('btn-leave-room');
const startErrorMessage = document.getElementById('start-error-message');
const mapSelect = document.getElementById('map-select');
const mapPreviewImg = document.getElementById('map-preview-img');
const openToggle = document.getElementById('open-toggle');
const labelOpenToggle = document.getElementById('label-open-toggle');
const serversListContainer = document.getElementById('servers-list-container');
const roomNameInput = document.getElementById('room-name-input');

const mapImages = {
    'classic': '../../assets/maps-preview/classic.png',
    'classic_mini': '../../assets/maps-preview/classic_mini.png',
    'dust2': '../../assets/maps-preview/dust2.png',
    'dust2_mini' : '../../assets/maps-preview/dust2_mini.png',
    'open-field': '../../assets/maps-preview/open-field.png'
};
const modeNames = {
    'deathmatch': 'Сам за себя',
    'team_deathmatch': 'Командный бой',
    'elimination': 'Раунды'
};

const mapNames = {
    'classic': 'Классика',
    'classic_mini': 'Классика (Мини)',
    'dust2': 'Dust 2',
    'dust2_mini': 'Dust 2 (Мини)',
    'open-field': 'Открытое поле'
};

let isReady = false;
let currentRoomId = null;

function renderPlayersList(players, amIHost) {
    playerList.innerHTML = '';
    if (players.length === 0) {
        playerList.innerHTML = '<p>Ожидание сервера...</p>';
        return;
    }
    const classNames = {
        'soldier': 'Солдат',
        'flamethrower': 'Огнеметчик'
    };
    players.forEach((player) => {
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-item';
        const status = player.isReady ? 'ready' : 'waiting';
        const statusText = player.isReady ? 'ГОТОВ' : 'НЕ ГОТОВ';
        const teamClass = player.team ? player.team : 'none';
        const classNameStr = classNames[player.className] || 'Солдат';

        let kickBtnHTML = '';
        if (amIHost) {
            if (!player.isHost) {
                kickBtnHTML = `<button class="btn-kick" data-userid="${player.userId}" title="Выгнать игрока">✖</button>`;
            } else {
                kickBtnHTML = `<div class="kick-placeholder"></div>`;
            }
        }
        const hostIconHTML = player.isHost ? '<span class="player-host-icon" title="Хост комнаты">👑</span>' : '';
        playerDiv.innerHTML = `
            <div class="player-info">
                <span class="player-name ${teamClass}">${player.nickname}</span>
                ${hostIconHTML}
            </div>
            <div class="player-controls">
                <span class="player-class-label">${classNameStr}</span>
                <span class="player-status ${status}">${statusText}</span>
                ${kickBtnHTML}
            </div>
        `;
        playerList.appendChild(playerDiv);
    });
    if (amIHost) {
        document.querySelectorAll('.btn-kick').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetUserId = e.target.getAttribute('data-userid');
                network.send('kick-player', { userId: targetUserId });
            });
        });
    }
}

network.on('stateRoom', (payload) => {
    if (document.activeElement !== roomNameInput) {
        roomNameInput.value = payload.roomName;
    }
    currentRoomId = payload.roomId;
    startErrorMessage.classList.add('hidden');
    roomIdSpan.textContent = currentRoomId;
    curCountPlayers.textContent = payload.countUsers;
    maxCountPlayers.textContent = payload.maxCountUsers;

    renderPlayersList(payload.users, payload.amIHost);

    classSelectionToggle.checked = payload.isClassSelectionEnabled;
    fogToggle.checked = payload.isFogEnabled;
    openToggle.checked = payload.isOpen;

    if (!payload.isClassSelectionEnabled && payload.users.length > 0) {
        classSelect.value = payload.users[0].className;
    }

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

        roundBanner.classList.add('hidden');
    });

    if (payload.modeType) {
        modeSelect.value = payload.modeType;

        if (payload.modeType === 'team_deathmatch' || payload.modeType === 'elimination') {
            teamSelectionControls.classList.remove('hidden');
        } else {
            teamSelectionControls.classList.add('hidden');
        }
    }

    if (payload.mapId) {
        mapSelect.value = payload.mapId;
        mapPreviewImg.src = mapImages[payload.mapId] || mapImages['classic'];
    }

    if (payload.amIHost) {
        startGameBtn.classList.remove('hidden');
        fogToggle.disabled = false;
        labelFogToggle.classList.remove('disabled');

        durationSelect.disabled = false;
        durationInput.disabled = false;
        modeSelect.disabled = false;
        mapSelect.disabled = false;
        roomNameInput.disabled = false;
        openToggle.disabled = false;
        labelOpenToggle.classList.remove('disabled');

        classSelectionToggle.disabled = false;
        labelClassSelectionToggle.classList.remove('disabled');
        classSelect.disabled = false;

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
        mapSelect.disabled = true;
        roomNameInput.disabled = true;
        openToggle.disabled = true;

        classSelectionToggle.disabled = true;
        labelClassSelectionToggle.classList.add('disabled');
        labelOpenToggle.classList.add('disabled');

        classSelect.disabled = !payload.isClassSelectionEnabled;
    }
    if (screens.game.classList.contains('hidden') && screens.gameOver.classList.contains('hidden')) {
        showScreen('room');
    }
});

network.on('rooms-list', (payload) => {
    serversListContainer.innerHTML = '';

    if (!payload || payload.length === 0) {
        serversListContainer.innerHTML = '<p class="server-message">Нет доступных открытых комнат.</p>';
        showScreen('serversList');
        return;
    }

    payload.forEach(room => {
        const readableMode = modeNames[room.mode] || room.mode;
        const readableMap = mapNames[room.map] || room.map;

        const div = document.createElement('div');
        div.className = 'server-item';
        div.innerHTML = `
            <div class="server-item__info">
                <span class="server-item__name">${room.name}</span>
                <span>ID: ${room.roomId} | Карта: ${readableMap} | Режим: ${readableMode}</span>
                <span>Игроки: ${room.countUsers} / ${room.maxUsers}</span>
            </div>
            <button class="btn btn-join-server" data-id="${room.roomId}">ВОЙТИ</button>
        `;
        serversListContainer.appendChild(div);
    });

    document.querySelectorAll('.btn-join-server').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const roomId = e.target.getAttribute('data-id');
            isReady = false;
            readyBtn.textContent = 'ГОТОВ';
            network.send('join-room', { roomId });
        });
    });

    showScreen('serversList');
});
network.on('kicked', (payload) => {
    alert(payload.message || "Вас выгнали из комнаты.");
    isReady = false;
    readyBtn.textContent = 'ГОТОВ';
    showScreen('lobbyMenu');
});

document.querySelector('.btn-serversList').addEventListener('click', () => {
    network.send('get-rooms', {});
});
document.querySelector('.btn-refresh-servers').addEventListener('click', () => {
    serversListContainer.innerHTML = '<p class="server-message">Обновление списка...</p>';
    network.send('get-rooms', {});
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
openToggle.addEventListener('change', (e) => {
    const isOpen = openToggle.checked === true;
    network.send('toggle-open-room', {isOpen: isOpen});
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
classSelectionToggle.addEventListener('change', (e) => {
    network.send('toggle-class-selection', { isEnabled: e.target.checked });
});
classSelect.addEventListener('change', (e) => {
    network.send('change-class', { className: e.target.value });
});
mapSelect.addEventListener('change', (e) => {
    network.send('change-map', { mapId: e.target.value });
});
stayInRoomBtn.addEventListener('click', () => {
    isReady = false;
    readyBtn.textContent = 'ГОТОВ';
    showScreen('room');
});
roomNameInput.addEventListener('change', (e) => {
    network.send('change-room-name', { roomName: e.target.value });
});

leaveRoomBtn.addEventListener('click', () => {
    network.send('exit-room', {});
    isReady = false;
    readyBtn.textContent = 'ГОТОВ';
    showScreen('lobbyMenu');
});

network.on('start-error', (payload) => {
    startErrorMessage.textContent = payload.message;
    startErrorMessage.classList.remove('hidden');
});

network.on('join-error', (payload) => {
    joinErrorMessage.textContent = payload.message;
    joinErrorMessage.classList.remove('hidden');
});

network.on('start-game',  async(payload) => {

    const assets = await assetsPromise;

    showScreen('game');

    roundBanner.classList.add('hidden');

    if (!game) {
        game = new Game(canvas, assets, togglePauseUI);
    }
    setPauseGameReference(game);

    canvas.focus();

    game.start(MultiplayerTestMode, network, payload.mapLayout);

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
    roundBanner.classList.add('hidden');
    if (game) {
        game.stop();
        game.isGameEnded = true;
        togglePauseUI(false);
    }

    gameOverTitle.className = 'menu-title';
    gameOverSubtitle.className = '';

    const titleElement = document.querySelector('#screen-game-over .menu-title');

    if (payload.mode === 'team_deathmatch' || payload.mode === 'elimination') {

        if (payload.winnerTeam === 'red') {
            gameOverTitle.textContent = 'ПОБЕДА КРАСНЫХ';
            gameOverTitle.classList.add('text-win-red');
        } else if (payload.winnerTeam === 'blue') {
            gameOverTitle.textContent = 'ПОБЕДА СИНИХ';
            gameOverTitle.classList.add('text-win-blue');
        } else {
            gameOverTitle.textContent = 'НИЧЬЯ';
            gameOverTitle.classList.add('text-win-draw');
        }

        gameOverSubtitle.textContent = `КРАСНЫЕ ${payload.redScore} : ${payload.blueScore} СИНИЕ`;
        gameOverSubtitle.classList.add('text-score-big');

    } else {
        if (payload.winner === 'DRAW') {
            gameOverTitle.textContent = 'МАТЧ ОКОНЧЕН';
            gameOverSubtitle.textContent = 'НИЧЬЯ';
            gameOverSubtitle.classList.add('text-win-draw', 'text-subtitle');
        } else {
            gameOverTitle.textContent = 'ПОБЕДИТЕЛЬ:';
            gameOverSubtitle.textContent = payload.winner;
            gameOverSubtitle.classList.add('text-win-gold', 'text-subtitle');
        }
    }

    const tbody = document.getElementById('end-game-stats-body');
    tbody.innerHTML = '';

    payload.stats.forEach((s, index) => {
        const tr = document.createElement('tr');
        tr.className = 'stats-row';

        if (payload.mode === 'team_deathmatch' || payload.mode === 'elimination') {
            if (s.team === 'red') tr.classList.add('stats-row--red');
            else if (s.team === 'blue') tr.classList.add('stats-row--blue');
            else tr.classList.add('stats-row--default');
        } else {
            if (index === 0) tr.classList.add('stats-row--gold');
            else tr.classList.add('stats-row--default');
        }

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
    joinErrorMessage.classList.add('hidden');
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

network.connect();
showScreen('lobbyMenu');

