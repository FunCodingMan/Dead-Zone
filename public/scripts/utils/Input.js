export class Input {
    constructor(canvas) {
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;

        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        canvas.addEventListener('mousemove', (e) => {
            //Находим реальные координаты мышки на canvas, вычитая отступы canvas от обшей координаты
            const rect = canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        canvas.addEventListener('mousedown', (e) => {
            this.isMouseDown = true;
        });

        canvas.addEventListener('mouseup', (e) => {
            this.isMouseDown = false;
        })
    }

    isMouseDown() {
        return this.isMouseDown;
    }

    isPressed(code) {
        return this.keys[code] === true;
    }
}