import { AssetManager } from './utils/AssetManager.js';
import { Game } from './core/Game.js';
import { initMenu, togglePauseUI } from './ui/Menu.js';

import { TrainingMode } from './single-player-games/TrainingMode.js';
import { WavesMode } from './single-player-games/WavesMode.js';

const canvas = document.getElementById('gameCanvas');
const assetManager = new AssetManager();
let game = null;
let lastSelectedMode = TrainingMode;

async function init() {
    const assets = await assetManager.loadAll();
    game = new Game(canvas, assets, togglePauseUI);

    initMenu({
        onStart: (modeName) => {
            switch (modeName) {
                case 'training':
                    lastSelectedMode = TrainingMode;
                    break;
                case 'waves':
                    lastSelectedMode = WavesMode;
                    break;
            }
            game.start(lastSelectedMode);
        },
        onResume: () => game.togglePause(),
        onRestart: () => {
            game.start(lastSelectedMode);
            togglePauseUI(false);
        },
        onExitToMenu: () => {
            game.stop();
            togglePauseUI(false);
        }
    });
}

init();