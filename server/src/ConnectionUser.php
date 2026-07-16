<?php

namespace App;

use App\app\model\User;
use App\app\repository\IUserRepository;
use LobbyUser;

class ConnectionUser
{
    /** @var LobbyUser[] $lobbyUsers */
    private array $lobbyUsers;
    private IUserRepository $repository;

    public function __construct(IUserRepository $repository)
    {
        $this->lobbyUsers = [];
        $this->repository = $repository;
    }

    public function connection(int $fd, ?array $cookie): bool
    {
        if (isset($cookie['token'])) {
            $user = $this->repository->getUserByToken($cookie['token']);
            if ($user) {
                $lobbyUser = new LobbyUser($fd, $user->getUserId());
                $this->lobbyUsers[] = $lobbyUser;
                return true;
            }
        }
        return false;
    }

    public function unconnection(int $fd): void
    {
        if (isset($this->connections[$fd])) {
            unset($this->connections[$fd]);
        }
    }

    public function getConnections(): array
    {
        //return [$this->lobbyUsers];
    }
}