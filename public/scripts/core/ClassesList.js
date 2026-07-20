import { CONFIG } from "./Config.js";

const MAX_SHOTS_AMOUNT_SOLDIER = 50;
const SHOOT_COOLDOWN_SOLDIER = 75;
const BULLET_WIDTH_SOLDIER = 5;
const BULLET_HEIGHT_SOLDIER = 10;
const SHOT_OFFSET_FORWARD_SOLDIER = 5;
const SHOT_OFFSET_SIDE_SOLDIER = 5;
const SPEED_SOLDIER = 5;
const BULLET_SPEED_SOLDIER = 20;
const DAMAGE_SOLDIER = 40;

const MAX_SHOTS_AMOUNT_FLAMETHROWER = 5000;
const SHOOT_COOLDOWN_FLAMETHROWER = 5;
const BULLET_WIDTH_FLAMETHROWER = 20;
const BULLET_HEIGHT_FLAMETHROWER = 20;
const SHOT_OFFSET_FORWARD_FLAMETHROWER = 12;
const SHOT_OFFSET_SIDE_FLAMETHROWER = 3;
const SPEED_FLAMETHROWER = 3;
const BULLET_SPEED_FLAMETHROWER = 20;
const DAMAGE_FLAMETHROWER = 10;


export const classes = [
    {
        className: CONFIG.SOLDIER_CLASS_NAME,
        attackType: CONFIG.SHOOT_ATTACK_TYPE,
        src: "../../assets/soldier_icon.png",
        ammo: MAX_SHOTS_AMOUNT_SOLDIER,
        shootCooldown: SHOOT_COOLDOWN_SOLDIER,
        bulletWidth: BULLET_WIDTH_SOLDIER,
        bulletHeight: BULLET_HEIGHT_SOLDIER,
        speed: SPEED_SOLDIER,
        shotOffsetForward: SHOT_OFFSET_FORWARD_SOLDIER,
        shotOffsetSide: SHOT_OFFSET_SIDE_SOLDIER,
        bulletSpeed: BULLET_SPEED_SOLDIER,
        damage: DAMAGE_SOLDIER
    },
    {
        className: CONFIG.FLAMETHROWER_CLASS_NAME,
        attackType: CONFIG.SHOOT_ATTACK_TYPE,
        src: "../../assets/flamethrower_icon.png",
        ammo: MAX_SHOTS_AMOUNT_FLAMETHROWER,
        shootCooldown: SHOOT_COOLDOWN_FLAMETHROWER,
        bulletWidth: BULLET_WIDTH_FLAMETHROWER,
        bulletHeight: BULLET_HEIGHT_FLAMETHROWER,
        speed: SPEED_FLAMETHROWER,
        shotOffsetForward: SHOT_OFFSET_FORWARD_FLAMETHROWER,
        shotOffsetSide: SHOT_OFFSET_SIDE_FLAMETHROWER,
        bulletSpeed: BULLET_HEIGHT_FLAMETHROWER,
        damage: DAMAGE_FLAMETHROWER
    }
]