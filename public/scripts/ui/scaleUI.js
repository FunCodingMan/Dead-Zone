function updateMenuScale() {
    const baseWidth = 1920;
    const baseHeight = 1080;

    const scaleX = window.innerWidth / baseWidth;
    const scaleY = window.innerHeight / baseHeight;

    const scale = Math.min(scaleX, scaleY);

    document.documentElement.style.setProperty('--menu-scale', scale);
}

window.addEventListener('resize', updateMenuScale);
window.addEventListener('DOMContentLoaded', updateMenuScale);
updateMenuScale();