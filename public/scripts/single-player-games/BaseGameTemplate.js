export class BaseGameTemplate {
    constructor(engine) {
        this.engine = engine;
    }

    // Инициализация, загрузка карты, спавн игрока, боты
    init () {
        this.engine.isGameEnded = false;
    }
    // Логика режима (проверка на победу, спавн врагов и т.д.)
    update (dt) {

    }
    // Отрисовка UI (таймеры, счётчики и т.д.)
    drawUI(ctx, canvas) {

    }
    // Очистка таймеров, listeners при выходе из режима
    destroy() {

    }
}