export class ClassSelector {
    constructor(classes) {
        this.classes = classes;
    }

    show() {
        return new Promise((resolve) => { 
            const modal = document.createElement('div');
            modal.className = 'class-selector-modal';
            
            this.classes.forEach(playerClass => {
                const button = document.createElement('button');
                button.className = 'class-selector-button';
                button.textContent = playerClass.name;

                const icon = document.createElement('img');
                icon.className = 'class-selector-icon';
                icon.src = playerClass.src;

                button.onclick = () => {
                    document.body.removeChild(modal);
                    resolve(playerClass);
                };
                button.appendChild(icon);
                modal.appendChild(button);
            });
            
            document.body.appendChild(modal);
        });
    }
}