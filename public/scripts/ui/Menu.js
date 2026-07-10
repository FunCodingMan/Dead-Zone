export function initMenu(actions) {
    document.getElementById('btn-continue').addEventListener('click', () => {
        actions.onResume();
    });

    document.getElementById('btn-new-game').addEventListener('click', () => {
        actions.onRestart();
    });

    document.querySelector('.pause-btn-back').addEventListener('click', () => {
        actions.onExitToMenu();
    });

}

export function togglePauseUI(isPaused) {
    if (isPaused) {
        document.querySelector('.pause-overlay').classList.add('active');
    } else {
        document.querySelector('.pause-overlay').classList.remove('active');
    }
}