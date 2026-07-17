import {Network} from "../../utils/Network.js";

const createBtn = document.querySelector('.room-submit');

const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const host = window.location.host;
const wsUrl = `${protocol}//${host}/ws/`;

const network = new Network(wsUrl);

network.on('yourRoomId', (payload) => {
    const roomId = payload.roomId;

    network.disconnect();

    window.location.href = `/mode-selection/multiplayer/room/?id=${roomId}`;
});

createBtn.addEventListener('click', (e) => {
    e.preventDefault();

    network.connect();

    createBtn.disabled = true;

    createBtn.value = 'ПОДКЛЮЧЕНИЕ...';

    const checkConnection = setInterval(() => {
        if (network.connectionStatus === 'connected') {
            clearInterval(checkConnection);

            network.send('create-room', {});
        }
    }, 50);
});