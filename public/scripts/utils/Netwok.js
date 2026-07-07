export class Network {
    constructor(url) {
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
            console.log('Успешное подключение к серверу!');
        };

        this.socket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            this.processResponse(data);
        }

        this.socket.onerror = (error) => {
            console.log('Произошла ошибка сервера!', error);
        }
    }

    processResponse(response) {
        switch (response.type) {
            case 'init':
                console.log(`Мы в игре! Наш ID: ${response.id}`);
                // TODO: Сохранить свой ID в класс Player
                break;

            case 'state':
                // Пришли свежие координаты всех игроков на сервере (приходит 20 раз в сек)
                // TODO: Передать массив response.players в игру для отрисовки
                break;

            case 'shoot':
                // Кто-то выстрелил. Рисуем визуальную пулю!
                console.log(`Игрок ${response.shooter_id} выстрелил под углом ${response.angle}`);
                // TODO: Создать объект летящей пули на Canvas
                break;

            case 'damage':
                // Сервер зафиксировал попадание!
                console.log(`Игрок ${response.target_id} получил ${response.damage} урона! Осталось HP: ${response.hp}`);
                // TODO: Обновить полоску здоровья, проиграть звук попадания или анимацию смерти
                break;

            case 'player_joined':
                // Кто-то новый зашел на сервер
                console.log(`Новый игрок ${response.id} на карте!`);
                // TODO: Добавить игрока на экран
                break;

            case 'player_left':
                // Кто-то вышел
                console.log(`🚪 Игрок ${response.id} отключился`);
                // TODO: Удалить игрока с экрана
                break;

            case 'teleport':
                // Анти-чит сервера вернул нас на законное место (Rubberbanding)
                console.warn(`🛑 Сервер откинул нас назад! X: ${response.x}, Y: ${response.y}`);
                // TODO: Жестко перезаписать координаты player.x и player.y
                break;
        }
    }

    sendMove(player) {
        if (this.socket.readyState !== WebSocket.OPEN) return;

        const payload = {
            type: 'move',
            x: Math.round(player.x),
            y: Math.round(player.y),
            angle: Number(player.angle.toFixed(2))
        };

        this.socket.send(JSON.stringify(payload));
    }

    sendShoot(player) {
        if (this.socket.readyState !== WebSocket.OPEN) return;

        const payload = {
            type: 'shoot',
            x: Math.round(player.x),
            y: Math.round(player.y),
            angle: Number(player.angle.toFixed(2))
        };

        this.socket.send(JSON.stringify(payload));
    }
}