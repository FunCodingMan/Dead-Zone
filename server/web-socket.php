<?php

use App\ConnectionUser;
use App\infrastructure\repository\ConnectionProvider;
use App\infrastructure\repository\UserTable;

require __DIR__ . '/../vendor/autoload.php';



$server = new \Swoole\WebSocket\Server("0.0.0.0", 9502);

$connectionDatabase = new ConnectionProvider();
$repository = new UserTable($connectionDatabase);
$connectionUser= new ConnectionUser($repository);


$server->on('open', function ($server, $request) use ($connectionUser) {
    if (!$connectionUser->connection($request->fd, $request->cookie)) {
        echo "connection failed\n";
        $server->close($request->fd);
        return;
    }
    echo "Клиент #{$request->fd} подключился\n";

});

$server->on('message', function ($server, $frame) {
    echo "Получено от #{$frame->fd}: {$frame->data}\n";
});

$server->on('close', function ($server, $fd) use ($connectionUser) {
    echo "Клиент #{$fd} отключился\n";
    $connectionUser->unconnection($fd);
});

\Swoole\Timer::tick(1000, function () use ($connectionUser) {
    echo json_encode($connectionUser->getConnections()) . "\n";
});

echo "WebSocket-сервер запущен на порту 9502\n";
$server->start();


