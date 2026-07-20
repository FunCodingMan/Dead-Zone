<?php

namespace App\app\game;

use App\PlayerController;
use App\QueueData;
use App\WebSocketParser;

class GameEngine
{
    private WebSocketParser $ws;
    private PlayerController $controller;
    private GameMap $map;
    private QueueData $queueData;

    public function __construct(WebSocketParser $ws, PlayerController $controller, QueueData $queueData, GameMap $map)
    {
        $this->ws = $ws;
        $this->controller = $controller;
        $this->map = $map;
        $this->queueData = $queueData;
    }

    public function pushData(): void
    {
        $arrData = $this->queueData->transferData();
        if (!empty($arrData)) {
            foreach ($arrData as $data) {
                $player = $this->controller->getPlayerByFd($data["fd"]);
                if (!empty($player)) {
                    $player->updateMovePlayer($data["payload"], $this->map);
                }
            }
        }
        $players = $this->controller->getPlayers();
        $this->ws->sendStateGame($players);
    }


    public function spawnPlayers(): void
    {
        $players = $this->controller->getPlayers();
        foreach ($players as $player) {
            $spawn = $this->map->findFreeSpawn(GameConfig::SYMBOL_PLAYER);
            $player->setPos($spawn['x'], $spawn['y']);
        }
    }
}