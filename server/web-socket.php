<?php

use App\Realtime\Application\Lobby;
use App\Realtime\Infrastructure\ConnectionRegistry;
use App\Realtime\Infrastructure\MessageValidator;
use App\Site\infrastructure\repository\ConnectionProvider;
use App\Site\infrastructure\repository\UserTable;

require __DIR__ . '/../vendor/autoload.php';



$server = new \Swoole\WebSocket\Server("0.0.0.0", 9502);

$connectionDatabase = new ConnectionProvider();
$repository = new UserTable($connectionDatabase);
$connectionUser= new ConnectionRegistry($repository);

$validator = new MessageValidator();
$ws = new \App\Realtime\Infrastructure\WebSocketTransport($server, $validator);

$lobby = new Lobby($ws, $connectionUser);


$server->on('open', function ($server, $request) use ($connectionUser) {
    if (!$connectionUser->register($request->fd, $request->cookie)) {
        echo "connection failed\n";
        $server->close($request->fd);
        return;
    }
    echo "Клиент #{$request->fd} подключился\n";

});

$server->on('message', function ($server, $frame) use ($ws, $lobby) {
    echo "Получено от #{$frame->fd}: {$frame->data}\n";
    $data = $ws->parse($frame->fd, $frame->data);

    if (empty($data)) {
        return;
    }

    $lobby->handleMessage($data);

    echo json_encode($data, JSON_UNESCAPED_UNICODE) . "---------------------------\n\n";
});

$server->on('close', function ($server, $fd) use ($connectionUser, $lobby) {
    echo "Клиент #{$fd} отключился\n";
    $lobby->exitUser($fd);
    $connectionUser->unregister($fd);

});


\Swoole\Timer::tick(33, function () use ($connectionUser, $lobby) {
    $lobby->updateActiveRooms();
});

echo "WebSocket-сервер запущен на порту 9502\n";
$server->start();


