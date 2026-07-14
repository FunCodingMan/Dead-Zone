<?php

require __DIR__ . '/../vendor/autoload.php';

use App\GameEngine;
use App\PlayersController;
use App\WebSocketParser;

$server = new \Swoole\WebSocket\Server("0.0.0.0", 9502);

$pc = new PlayersController();
$ws = new WebSocketParser($server);
$gameEngine = new GameEngine($pc, $ws);

$server->on('open', function ($server, $request) use ($pc) {
    echo "Клиент #{$request->fd} подключился\n";
    $pc->addPlayer($request->fd);
});

$server->on('message', function ($server, $frame) use ($ws) {
    echo "Получено от #{$frame->fd}: {$frame->data}\n";
    $ws->acceptNewStatePlayer($frame->fd, $frame->data);
    $server->push($frame->fd, "Ништяк браток, принял");
});

$server->on('close', function ($server, $fd) use ($pc){
    echo "Клиент #{$fd} отключился\n";
    $pc->deletePlayer($fd);
});


//json_encode(['player' => ['x' => 10, 'y' => 10, 'count-bullets' => 21, 'health' => 50, 'angle' => 90],
//                      'players' => [['x' => 11, 'y' => 11, 'count-bullets' => 11, 'health' => 11, 'angle' => 11],
//                          ['x' => 22, 'y' => 22, 'count-bullets' => 22, 'health' => 22, 'angle' => 22]]], JSON_UNESCAPED_UNICODE)


\Swoole\Timer::tick(10000, function () use ($gameEngine) {
    try {
        $gameEngine->pushData();
    } catch (RuntimeException $error) {
        echo $error->getMessage();
    }
});

echo "WebSocket-сервер запущен на порту 9502\n";
$server->start();


