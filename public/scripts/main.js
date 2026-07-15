import { AssetManager } from './utils/AssetManager.js';
import { Game } from './core/Game.js';
import { initPause, togglePauseUI } from './ui/Pause.js';

import { TrainingMode } from './single-player-games/TrainingMode.js';
import { WavesMode } from './single-player-games/WavesMode.js';
import { MultiplayerTestMode } from "./multiplayer/MultiplayerTestMode.js";


const canvas = document.getElementById('gameCanvas');
const assetManager = new AssetManager();
let game = null;
let lastSelectedMode = MultiplayerTestMode;

async function init() {
    const assets = await assetManager.loadAll();

    game = new Game(canvas, assets, togglePauseUI);

    initPause({
        onResume: () => game.togglePause(),
        onRestart: () => {
            game.start(lastSelectedMode);
            togglePauseUI(false);
        },
        onExitToMenu: () => {
            if (canvas.getAttribute('data-target') === 'multiplayer') {
                window.location.href = '/mode-selection';
                game.currentMode.network.disconnect();
            } else {
                window.location.href = '/mode-selection/singleplayer';
            }
        }
    });

    switch (canvas.getAttribute('data-target')) {
        case 'training':
            lastSelectedMode = TrainingMode;
            break;
        case 'waves':
            lastSelectedMode = WavesMode;
            break;
        case 'multiplayer':
            lastSelectedMode = MultiplayerTestMode;
    }

    game.start(lastSelectedMode);
}

init();