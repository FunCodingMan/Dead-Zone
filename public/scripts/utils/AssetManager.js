export class AssetManager {
    constructor() {
        this.assets = {
            wall: new Image(),
            box: new Image(),
            floor: new Image(),
            soldier: new Image(),
            bullet: new Image(),
            blood: new Image(),
            explosions: [],
            reloadIcon: new Image(),
            reloadSoldier: new Image(),
            shot1: new Image(),
            shot2: new Image(),
            heartIcon: new Image(),
            target: new Image(),
            zombie: new Image(),
            flame: new Image(),
            flamethrowerReload: new Image(),
            flamethrower: new Image(),
            flamethrowerReloadIcon: new Image(),
            bossDefault: new Image(),
            bossLightningAttack1: new Image(),
            bossLightningAttack2: new Image(),
            bossLaserAttack: new Image(),
            bossLaser: new Image(),
            bossLightning: new Image()
        };

        this.imagePaths = {
            wall: '/assets/wall.png',
            box: '/assets/box.png',
            floor: '/assets/floor.png',
            soldier: '/assets/soldier.png',
            bullet: '/assets/bullet_new.png',
            blood: '/assets/blood.png',
            reloadIcon: '/assets/reload_icon.png',
            reloadSoldier: '/assets/reload_soldier.png',
            shot1: '/assets/shot1.png',
            shot2: '/assets/shot2.png',
            heartIcon: '/assets/heart.png',
            target: '/assets/target.png',
            zombie: '/assets/zombie.png',
            flame: '/assets/flame.png',
            flamethrowerReload: '/assets/reload_flamethrower.png',
            flamethrower: '/assets/flamethrower.png',
            flamethrowerReloadIcon: '/assets/flamethrower_reload_icon.png',
            bossDefault: '/assets/boss.png',
            bossLightningAttack1: '/assets/boss_lightning_attack_1.png',
            bossLightningAttack2: '/assets/boss_lightning_attack_2.png',
            bossLaserAttack: '/assets/boss_laser_attack.png',
            bossLaser: '/assets/laser.png',
            bossLightning: '/assets/lightning.png'
        };

        this.DEATH_FRAMES_AMOUNT = 3;
    }

    loadImage(img, src) {
        return new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => {
                const errorMsg = `Ошибка загрузки картинки: ${src}`;
                console.error(errorMsg);
                reject(new Error(errorMsg));
            };
            img.src = src;
        });
    }

    async loadAll() {
        const promises = [];

        for (let key in this.imagePaths) {
            promises.push(this.loadImage(this.assets[key], this.imagePaths[key]));
        }

        for (let i = 0; i < this.DEATH_FRAMES_AMOUNT; i++) {
            this.assets.explosions[i] = new Image();
            promises.push(this.loadImage(this.assets.explosions[i], `/assets/burst${i + 1}.png`));
        }

        await Promise.all(promises);
        return this.assets;
    }

    get(name) {
        return this.assets[name];
    }
}