let globalGameReference = null;

export function initPause(callbacks) {
    const btnContinue = document.getElementById('btn-continue');
    const btnNewGame = document.getElementById('btn-new-game');
    const btnExit = document.querySelector('.pause-btn-back');
    const resolutionSelect = document.getElementById('resolution-select'); // Находим наш селект

    if (btnContinue) {
        btnContinue.replaceWith(btnContinue.cloneNode(true));
        document.getElementById('btn-continue').addEventListener('click', () => {
            if (callbacks.onResume) callbacks.onResume();
        });
    }

    if (btnNewGame) {
        btnNewGame.replaceWith(btnNewGame.cloneNode(true));
        document.getElementById('btn-new-game').addEventListener('click', () => {
            if (callbacks.onRestart) callbacks.onRestart();
        });
    }

    if (btnExit) {
        btnExit.replaceWith(btnExit.cloneNode(true));
        document.querySelector('.pause-btn-back').addEventListener('click', () => {
            if (callbacks.onExitToMenu) callbacks.onExitToMenu();
        });
    }

    if (resolutionSelect) {
        resolutionSelect.replaceWith(resolutionSelect.cloneNode(true));
        document.getElementById('resolution-select').addEventListener('change', (e) => {
            const [width, height] = e.target.value.split('x').map(Number);

            if (globalGameReference && typeof globalGameReference.setResolution === 'function') {
                globalGameReference.setResolution(width, height);
            }
        });
    }
}
export function setPauseGameReference(game) {
    globalGameReference = game;
}

export function togglePauseUI(isPaused) {
    if (isPaused) {
        document.querySelector('.pause-overlay').classList.add('active');
    } else {
        document.querySelector('.pause-overlay').classList.remove('active');
    }
}