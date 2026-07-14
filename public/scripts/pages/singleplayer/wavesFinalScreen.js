document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);

    const deathImageSrc = '/assets/death.png';
    const winImageSrc = '/assets/win.png';

    const gameResult = {
        result: urlParams.get('result'),
        wave: urlParams.get('wave'),
        damage: urlParams.get('damage'),
        kills: urlParams.get('kills')
    }

    const result = document.getElementById('result');
    const wave = document.getElementById('wave');
    const damage = document.getElementById('damage');
    const kills = document.getElementById('kills');
    const image = document.getElementById('image');
    
    const menuBtn = document.getElementById('menu');
    const restartBtn = document.getElementById('restart');

    menuBtn.addEventListener('click', () => {
        window.location.href = '/';
    });

    restartBtn.addEventListener('click', () => {
        window.location.href = '/mode-selection/singleplayer/waves';
    });

    if (gameResult.result === 'win') {
        result.textContent = 'ПОБЕДА';
        image.src = winImageSrc;
    } else {
        result.textContent = 'ПОРАЖЕНИЕ';
        image.src = deathImageSrc;
    }

    wave.textContent = `текущая волна: ${gameResult.wave}`;
    damage.textContent = `нанесено урона: ${gameResult.damage}`;
    kills.textContent = `уничтожено врагов: ${gameResult.kills}`;
})