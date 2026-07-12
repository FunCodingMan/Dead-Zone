<?php

$server = new Swoole\WebSocket\Server("0.0.0.0", 9502);

$server->on('open', function ($server, $request) {
    echo "Клиент #{$request->fd} подключился\n";
});

$server->on('message', function ($server, $frame) {
    echo "Получено от #{$frame->fd}: {$frame->data}\n";
    $server->push($frame->fd, "Сервер получил: {$frame->data}");
});

$server->on('close', function ($server, $fd) {
    echo "Клиент #{$fd} отключился\n";
});

echo "WebSocket-сервер запущен на порту 9502\n";
$server->start();
