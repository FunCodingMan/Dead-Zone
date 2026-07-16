import { Character } from "./Character.js";

const PLAYER_WIDTH = 28;
const PLAYER_HEIGHT = 48;

export class RemotePlayer extends Character {
    constructor(id, initialX, initialY) {
        super({x: initialX, y: initialY}, PLAYER_WIDTH, PLAYER_HEIGHT,  -1);

        this.id = id;

        this.targetX = initialX;
        this.targetY = initialY;

        this.hitpoints = 100;
    }

    updateServerState(state) {
        this.targetX = state.x;
        this.targetY = state.y;
        if (state.angle !== undefined) {
            this.angle = state.angle;
        }

        if (state.health !== undefined) {
            this.hitpoints = state.health;
        }
    }

    updateInterpolation(interpolationFactor = 0.2) {
        this.x += (this.targetX - this.x) * interpolationFactor;
        this.y += (this.targetY - this.y) * interpolationFactor;
    }

    draw(ctx, image) {
        super.draw(ctx, image);
    }
}