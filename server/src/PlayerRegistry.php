<?php

namespace App;

use App\app\model\Player;

class PlayerRegistry
{
    private array $players;
    private array $playersVisible;

    public function __construct()
    {
        $this->players = [];
        $this->playersVisible = [];
    }

    public function addPlayer(int $fd, string $userId): void
    {
        $player = new Player($fd, $userId);
        $this->players[$fd] = $player;
        $this->playersVisible[$fd] = ["me" => $player, "others" => []];
    }

    public function getPlayerByFd(int $fd): ?Player
    {
        return $this->players[$fd] ?? null;
    }

    public function getPlayers(): array
    {
        return $this->players;
    }
    public function removePlayer(int $fd): void
    {
        unset($this->players[$fd]);
        unset($this->playersVisible[$fd]);
    }

    public function getOthersPlayers(Player $me): array
    {
        $others = [];
        foreach ($this->players as $player) {
            if ($player !== $me) {
                $others[$player->getFd()] = $player;
            }
        }
        return $others;
    }

    public function sendVisiblePlayers(Player $player, array $others): void
    {
        $this->playersVisible[$player->getFd()] = ["me" => $player, "others" => $others];
    }

    public function getVisiblePlayers(): array
    {
        return $this->playersVisible;
    }
}