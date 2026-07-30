{
    let buttonOpenSinglePlayer = document.querySelector('.btn-singleplayer');
    buttonOpenSinglePlayer.addEventListener('click', () => {
        window.location.href = '/mode-selection/singleplayer';
    });
}