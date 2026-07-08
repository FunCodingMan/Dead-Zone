function switchScreen(screenId) {
    document.querySelectorAll('.menu-screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

export function initMenu(actions) {

    document.getElementById('btn-play').addEventListener('click', () => {
        switchScreen('screen-mode');
    });

    document.getElementById('btn-profile').addEventListener('click', () => {
        switchScreen('screen-profile');
    });

    document.getElementById('btn-exit').addEventListener('click', () => {
        //TODO: чистим cookie
    });

    document.getElementById('btn-singleplayer').addEventListener('click', () => {
        switchScreen('screen-singleplayer');
    });

    document.getElementById('btn-singleplayer-first-game').addEventListener('click', () => {
        document.getElementById('ui-layer').classList.remove('active');

        actions.onStart();
    });

    document.querySelectorAll('.btn-back').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetScreen = e.target.getAttribute('data-target');
            switchScreen(targetScreen);
        });
    });

    document.getElementById('btn-continue').addEventListener('click', () => {
        actions.onResume();
    });

    document.getElementById('btn-new-game').addEventListener('click', () => {
        actions.onRestart();
    });

    document.querySelector('.pause-menu__btn-back').addEventListener('click', () => {
        document.getElementById('ui-layer').classList.remove('pause');
        document.getElementById('ui-layer').classList.add('active');

        switchScreen('screen-singleplayer');
        actions.onExitToMenu();
    });

}

export function togglePauseUI(isPaused) {
    if (isPaused) {
        document.getElementById('ui-layer').classList.add('pause');
        switchScreen('screen-pause');
    } else {
        document.getElementById('ui-layer').classList.remove('pause');
        document.getElementById('screen-pause').classList.remove('active');
    }
}