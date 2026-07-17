
const joinBtn = document.querySelector('.join-room-submit');
const inputId = document.querySelector('.input-name');


joinBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const roomId = inputId.value;

    window.location.href = `/mode-selection/multiplayer/room/?id=${roomId}`;
});

