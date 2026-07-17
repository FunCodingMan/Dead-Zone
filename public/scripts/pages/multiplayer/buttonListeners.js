{
    let btnCreateRoom = document.querySelector('.btn-createRoom');
    btnCreateRoom.addEventListener('click', () => {
        window.location.href = '/mode-selection/multiplayer/create-room';
    });

    let btnJoinRoom = document.querySelector('.btn-joinRoom');
    btnJoinRoom.addEventListener('click', () => {
        window.location.href = '/mode-selection/multiplayer/join-room';
    });

    let btnExit = document.querySelector('.btn-exit');
    btnExit.addEventListener('click', () => {
        window.location.href = '/mode-selection';
    });
}