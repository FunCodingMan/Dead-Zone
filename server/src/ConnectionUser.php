<?php

namespace App;

use App\app\model\User;
use App\app\repository\IUserRepository;

class ConnectionUser
{
    /** @var int[] $connections */
    private array $connections;
    private IUserRepository $repository;

    public function __construct(IUserRepository $repository)
    {
        $this->connections = [];
        $this->repository = $repository;
    }

    public function connection(int $fd, ?array $cookie): bool
    {
        if (isset($cookie['token'])) {
            $user = $this->repository->getUserByToken($cookie['token']);
            if ($user) {
                $this->connections[$fd] = $user->getUserId();
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
        return $this->connections;
    }
}