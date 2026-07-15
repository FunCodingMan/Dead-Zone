<?php

namespace App;

use App\GameMap;

class GameEngine
{
    private PlayersController $controller;
    private WebSocketParser $parser;
    private GameMap $map;

    public function __construct(PlayersController $controller, WebSocketParser $parser)
    {
        $this->controller = $controller;
        $this->parser = $parser;
        $this->map = new GameMap();

        $levelData = "
        ################
        #P            P#
        #  ####  ####  #
        #  #        #  #
        #  ####  ####  #
        #P            P#
        ################";

        $this->map->loadLevel($levelData);
    }

    public function pushData(): void
    {
        $data = $this->parser->transferData();
        if (!empty($data)) {
            foreach ($data as $item) {
                $player = $this->controller->getPlayerByFd($item["fd"]);
                if (!empty($player)) {
                    $player->updateStatePlayer($item["data"], $this->map);
                }
            }
        }
        $players = $this->controller->getPlayers();
        $this->parser->updateDataPlayers($players);

    }

    public function spawnPlayer(int $fd): void
    {
        $player = $this->controller->getPlayerByFd($fd);

        if ($player !== null) {
            $spawn = $this->map->findFreeSpawn(GameConfig::SYMBOL_PLAYER);

            $player->setPos($spawn['x'], $spawn['y']);
        }
    }
}