<?php

use App\app\model\Player;
use App\ConnectionUser;
use App\infrastructure\repository\ConnectionProvider;
use App\infrastructure\repository\UserTable;
use App\MessageValidator;

require __DIR__ . '/../vendor/autoload.php';



$server = new \Swoole\WebSocket\Server("0.0.0.0", 9502);

$connectionDatabase = new ConnectionProvider();
$repository = new UserTable($connectionDatabase);
$connectionUser= new ConnectionUser($repository);

$validator = new MessageValidator();
$ws = new \App\WebSocketParser($server, $validator);


$server->on('open', function ($server, $request) use ($connectionUser) {
    if (!$connectionUser->connection($request->fd, $request->cookie)) {
        echo "connection failed\n";
        $server->close($request->fd);
        return;
    }
    echo "Клиент #{$request->fd} подключился\n";

});

$server->on('message', function ($server, $frame) use ($ws) {
    echo "Получено от #{$frame->fd}: {$frame->data}\n";
    $data = $ws->parse($frame->fd, $frame->data);

    echo json_encode($data, JSON_UNESCAPED_UNICODE);
});

$server->on('close', function ($server, $fd) use ($connectionUser) {
    echo "Клиент #{$fd} отключился\n";
    $connectionUser->disconnection($fd);
});


\Swoole\Timer::tick(10000, function () use ($connectionUser, $ws) {
    echo json_encode($connectionUser->getConnections()) . "\n";
});

echo "WebSocket-сервер запущен на порту 9502\n";
$server->start();


