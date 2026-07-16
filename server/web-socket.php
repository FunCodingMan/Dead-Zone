<?php

require __DIR__ . '/../vendor/autoload.php';

use App\app\game\GameEngine;
use App\infrastructure\repository\ConnectionProvider;
use App\infrastructure\repository\UserTable;
use App\infrastructure\websocket\PlayersController;
use App\infrastructure\websocket\WebSocketParser;

$server = new \Swoole\WebSocket\Server("0.0.0.0", 9502);


$connectionProvider = new ConnectionProvider();
$userTable = new UserTable($connectionProvider);
$pc = new PlayersController($userTable);
$ws = new WebSocketParser($server);
$gameEngine = new GameEngine($pc, $ws);

$server->on('open', function ($server, $request) use ($pc, $gameEngine) {
    echo "Клиент #{$request->fd} подключился\n";
    $pc->addPlayer($request->fd, $request->cookie ?? []);

    $gameEngine->spawnPlayer($request->fd);
});

$server->on('message', function ($server, $frame) use ($ws) {
    echo "Получено от #{$frame->fd}: {$frame->data}\n";
    $ws->acceptNewStatePlayer($frame->fd, $frame->data);
//    $server->push($frame->fd, "Ништяк браток, принял");
});

$server->on('close', function ($server, $fd) use ($pc){
    echo "Клиент #{$fd} отключился\n";
    $pc->deletePlayer($fd);
});

\Swoole\Timer::tick(33, function () use ($gameEngine) {
    try {
        $gameEngine->pushData();
    } catch (RuntimeException $error) {
        echo $error->getMessage();
    }
});

echo "WebSocket-сервер запущен на порту 9502\n";
$server->start();


