const RECONNECT_INTERVAL_MS = 3000;
const USE_MOCK = true;

export class Network {
    constructor(url) {
        this.url = url;

        this.socket = null;

        this.isConnected = false;

        this.reconnectTimer = null;

        this.listeners = new Map();
    }

    on(type, callback) {
        if(!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push(callback);
    }

    off(type, callback) {
        if(!this.listeners.has(type)) return;

        const callbacks = this.listeners.get(type).filter(cb => cb !== callback);

        this.listeners.set(type, callbacks);
    }

    emit(type, payload) {
        if (this.listeners.has(type)) {
            this.listeners.get(type).forEach(callback => callback(payload));
        }
    }

    connect() {
        this.socket = USE_MOCK ? new MockWebSocket(this.url) : new WebSocket(this.url);

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
            this.reconnectTimer = null;
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

            if (message.type) {
                this.emit(message.type, message.payload);
            }
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
        if (!this.socket || this.socket.readyState !== WebSocketState.OPEN) return;

        const message = JSON.stringify({type, payload});

        this.socket.send(message);

        console.log('Данные успешно отправлены на сервер: ', message);
    }

}

const WebSocketState = Object.freeze({
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
});

class MockWebSocket {
    constructor(url) {
        this.url = url;

        this.readyState = WebSocketState.CONNECTING;

        setTimeout(() => {
            this.readyState = WebSocketState.OPEN;
            if (this.onopen) {
                this.onopen();
            }

            this.sendServerMessage({ type: 'init', payload: {uuid: 123}});
        }, 100);
    }

    send(data) {
        const parsedData = JSON.parse(data);

        console.log('[SERVER] Фронтенд отправил', data);

        setTimeout(() => this.methodController(parsedData), 50);

    }

    methodController(parsedData) {
        switch (parsedData.type) {
            case 'join_lobby':
                console.log('[SERVER] Игрок присоединился к лобби.');
                this.sendServerMessage({
                    type: 'JOINED_LOBBY',
                    payload: {session_id: 'id1234'}
                });
                break;
            case 'ready':
                console.log('[SERVER] Игрок готов к игре.');
                this.sendServerMessage({
                    type: 'spawn',
                    payload: {x: '100', y: '100'}
                });
                break;
            case 'reload':
                console.log('[SERVER] Игрок перезаряжается.');
                this.sendServerMessage({
                    type: 'reloaded',
                    payload: {bullets: 30}
                });
                break;
            case 'shot':
                console.log('[SERVER] Выстрел произошёл, угол - ', parsedData.payload.angle);
                break;
            case 'move':
                console.log('[SERVER нажаты клавиши', parsedData.payload.keyboard, ', угол игрока: ', parsedData.payload.angle);
                break;
            default:
                console.warn('[SERVER] Получена неизвестная команда!');
        }
    }


    sendServerMessage(obj) {
        if (this.onmessage && this.readyState === WebSocketState.OPEN) {
            this.onmessage({data: JSON.stringify(obj)});
        }
    }

    close() {
        this.readyState = WebSocketState.CLOSING;

        setTimeout(() => {
            this.readyState = WebSocketState.CLOSED;
            if (this.onclose) {
                this.onclose();
            }
        }, 50);
    }


}