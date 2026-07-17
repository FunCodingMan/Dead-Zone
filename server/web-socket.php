<?php

use App\app\model\Player;
use App\ConnectionUser;
use App\infrastructure\repository\ConnectionProvider;
use App\infrastructure\repository\UserTable;
use App\Lobby;
use App\LobbyUser;
use App\MessageValidator;

require __DIR__ . '/../vendor/autoload.php';



$server = new \Swoole\WebSocket\Server("0.0.0.0", 9502);

$connectionDatabase = new ConnectionProvider();
$repository = new UserTable($connectionDatabase);
$connectionUser= new ConnectionUser($repository);

$validator = new MessageValidator();
$ws = new \App\WebSocketParser($server, $validator);

$lobby = new Lobby($ws, $connectionUser);


$server->on('open', function ($server, $request) use ($connectionUser) {
    if (!$connectionUser->connection($request->fd, $request->cookie)) {
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

    $lobby->handler($data);

    echo json_encode($data, JSON_UNESCAPED_UNICODE) . "---------------------------\n\n";
});

$server->on('close', function ($server, $fd) use ($connectionUser, $lobby) {
    echo "Клиент #{$fd} отключился\n";
    $lobby->exitUser($fd);
    $connectionUser->disconnection($fd);

});


\Swoole\Timer::tick(10000, function () use ($connectionUser, $lobby) {
//    $lobby->updateStateRooms();
});

echo "WebSocket-сервер запущен на порту 9502\n";
$server->start();


