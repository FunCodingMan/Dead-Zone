<?php

namespace App;

use App\app\model\Player;

class PlayerRegistry
{
    private array $players;

    public function __construct()
    {
        $this->players = [];
    }

    public function addPlayer(int $fd, string $userId): void
    {
        $player = new Player($fd, $userId);
        $this->players[$fd] = $player;
    }

    public function deletePlayer(int $fd): void
    {
        unset($this->players[$fd]);
    }

    public function getPlayerByFd(int $fd): ?Player
    {
        return $this->players[$fd] ?? null;
    }

    public function getPlayers(): array
    {
        return $this->players;
    }
}