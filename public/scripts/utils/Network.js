const RECONNECT_INTERVAL_MS = 3000;

class Network {
    constructor(url) {
        this.url = url;

        this.socket = null;

        this.isConnected = false;

        this.reconnectTimer = null;

    }

    connect() {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => this.openConnection();

        this.socket.onmessage = (msg) => this.getMessage(msg);

        this.socket.onclose = () => this.connectionIsClosed();

        this.socket.onerror = (error) => this.getError(error);

    }

    openConnection() {
        this.isConnected = true;
        console.log('Подключение к WebSocket успешно!');

        if (this.reconnectTimer) {
            clearInterval(this.reconnectTimer);
        }
    }

    connectionIsClosed() {
        this.isConnected = false;

        console.log('Соединение с сервером потеряно!');

        this.reconnect();
    }

    getMessage(msg) {
        try {
            const message = JSON.parse(msg.data) ;

            console.log('Пришло сообщение от сервера: ', message);
        } catch (error) {
            console.log('Ошибка парсинга ответа от сервера.');
        }
    }

    getError(error) {
        console.error('Ошибка сервера: ', error);
    }

    reconnect() {
        if (!this.reconnectTimer) {
            this.reconnectTimer = setInterval(() => {
                console.log('Попытка переподключения...');
                this.connect();
            }, RECONNECT_INTERVAL_MS);
        }
    }

    send(type, payload) {
        if (!this.isConnected || !this.socket) return;

        const message = JSON.stringify({type, payload});

        this.socket.send(message);

        console.log('Данные успешно отправлены на сервер: ', message);
    }





}

export default Network