{
    let buttonOpenSinglePlayer = document.querySelector('.btn-multiplayer');
    buttonOpenSinglePlayer.addEventListener('click', () => {
        window.location.href = '/mode-selection/multiplayer';
    });
}