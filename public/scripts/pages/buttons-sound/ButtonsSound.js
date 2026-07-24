const uiClickSound = new Audio('../../assets/sounds/click.wav');
uiClickSound.volume = 1;
const uiHoverSound = new Audio('../../assets/sounds/hover.mp3');
uiHoverSound.volume = 1;

const allButtons = document.querySelectorAll('.btn');
allButtons.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
        if (!btn.classList.contains('disabled') && !btn.disabled) {
            uiHoverSound.currentTime = 0;
            uiHoverSound.play().catch(e => {});
        }
    });
});

allButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        uiClickSound.currentTime = 0;
        uiClickSound.play().catch(e => {});
    });
});