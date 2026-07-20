<?php

namespace App\app\game;

use App\PlayerRegistry;
use App\MessageQueue;
use App\WebSocketTransport;

class GameEngine
{
    private WebSocketTransport $ws;
    private PlayerRegistry $registry;
    private GameMap $map;
    private MessageQueue $queue;

    public function __construct(WebSocketTransport $ws, PlayerRegistry $registry, MessageQueue $queue, GameMap $map)
    {
        $this->ws = $ws;
        $this->registry = $registry;
        $this->map = $map;
        $this->queue = $queue;
    }

    public function pushData(): void
    {
        $arrData = $this->queue->dequeueAll();
        if (!empty($arrData)) {
            foreach ($arrData as $data) {
                $player = $this->registry->getPlayerByFd($data["fd"]);
                if (!empty($player)) {
                    $player->updateMovePlayer($data["payload"], $this->map);
                }
            }
        }
        $players = $this->registry->getPlayers();
        $this->ws->broadcastGameState($players);
    }


    public function spawnPlayers(): void
    {
        $players = $this->registry->getPlayers();
        foreach ($players as $player) {
            $spawn = $this->map->findFreeSpawn(GameConfig::SYMBOL_PLAYER);
            $player->setPos($spawn['x'], $spawn['y']);
        }
    }
}