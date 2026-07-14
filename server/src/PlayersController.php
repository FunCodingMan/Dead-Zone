<?php

namespace App;

use App\Player;

class PlayersController
{
    /**
     * @var Player[]
     */
    private array $players;

    public function __construct()
    {
        $this->players = [];
    }

    public function addPlayer(int $fd): void
    {
        $player = new Player($fd);
        $this->players[] = $player;
    }

    public function deletePlayer(int $fd): void
    {
        $player = $this->getPlayerByFd($fd);
        if (!empty($player)) {
            $key = array_search($player, $this->players, true);
            unset($this->players[$key]);
            $this->players = array_values($this->players);
        }
    }

    public function getPlayerByFd(int $fd): ?Player
    {
        foreach ($this->players as $player) {
            if ($player->getFd() === $fd) {
                return $player;
            }
        }
        return null;
    }

    public function getPlayers(): array
    {
        return $this->players;
    }

}