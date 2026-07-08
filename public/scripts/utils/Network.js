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
            case 'spawn':
                // Получаем x, y, angle, map
                break;

            case 'state':
                // Пришли свежие координаты всех игроков на сервере
                break;

            case 'shoot':
                // Кто-то выстрелил. Рисуем визуальную пулю!
                break;

            case 'damage':
                // Сервер зафиксировал попадание! (from_uuid, to_uuid, damage)
                break;

            case 'player_joined':
                // Кто-то новый зашел на сервер
                break;

            case 'player_left':
                // Кто-то вышел
                break;

            case 'teleport':
                // Анти-чит сервера вернул игрока на предыдущее место
                break;
            case 'ban':
                // Сервер забанил игрока
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