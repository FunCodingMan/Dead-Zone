<?php

namespace App;

class GameEngine
{
    private PlayersController $controller;
    private WebSocketParser $parser;

    public function __construct(PlayersController $controller, WebSocketParser $parser)
    {
        $this->controller = $controller;
        $this->parser = $parser;
    }

    public function pushData(): void
    {
        $data = $this->parser->transferData();
        if (!empty($data)) {
            foreach ($data as $item) {
                $player = $this->controller->getPlayerByFd($item["fd"]);
                if (!empty($player)) {
                    $player->updateStatePlayer($item["data"]);
                }
            }
        }
        $players = $this->controller->getPlayers();
        $this->parser->updateDataPlayers($players);

    }


}