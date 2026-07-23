export class Input {
    constructor(canvas, callbacks = {}) {
        this.canvas = canvas;
        this.keys = {};
        this.justPressed = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;

        this.onEscape = callbacks.onEscape || null;

        // Привязка контекста
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);


        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mousedown', this.handleMouseDown);
        window.addEventListener('mouseup', this.handleMouseUp);

        window.addEventListener('blur', this.boundOnBlur);

        this.canvas.addEventListener('contextmenu', this.handleContextMenu);
    }

    boundOnBlur = () => {
        this.reset();
    }

    handleContextMenu(e) {
        e.preventDefault();
    }

    handleKeyDown(e) {
        if (e.code === 'Tab' || e.code === 'Space') {
            e.preventDefault();
        }
        if (!this.keys[e.code]) {
            this.justPressed[e.code] = true;
        }

        this.keys[e.code] = true;

        if (e.key === 'Escape' && this.onEscape) {
            this.onEscape();
        }
    }

    handleKeyUp(e) {
        this.keys[e.code] = false;
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
    }

    handleMouseDown() {
        this.isMouseDown = true;
    }

    handleMouseUp() {
        this.isMouseDown = false;
    }

    isPressed(code) {
        return this.keys[code] === true;
    }

    isJustPressed(code) {
        if (this.justPressed[code]) {
            this.justPressed[code] = false;
            return true;
        }
        return false;
    }

    reset() {
        this.keys = {};
        this.justPressed = {};
        this.isMouseDown = false;
    }

    destroyListeners() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('mousedown', this.handleMouseDown);
        window.removeEventListener('mouseup', this.handleMouseUp);
        window.removeEventListener('blur', this.boundOnBlur);
    }
}