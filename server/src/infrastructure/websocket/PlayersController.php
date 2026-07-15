<?php

namespace App\infrastructure\websocket;

use App\app\model\Player;
use App\app\repository\IUserRepository;

class PlayersController
{
    /**
     * @var Player[]
     */
    private array $players;
    private IUserRepository $repository;

    public function __construct(IUserRepository $repository)
    {
        $this->repository = $repository;
        $this->players = [];
    }

    public function addPlayer(int $fd, array $cookie): void
    {
        if (isset($cookie['token'])) {
            $user = $this->repository->getUserByToken($cookie['token']);
            if ($user !== null) {
                $userId = $user->getUserId();
                $player = new Player($fd, $userId);
                $this->players[] = $player;
            }
        }

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