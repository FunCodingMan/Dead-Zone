<?php

namespace App;

use App\app\model\User;
use App\app\repository\IUserRepository;

class ConnectionUser
{
    /** @var User[] $connections */
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
                $this->connections[$fd] = $user;
                return true;
            }
        }
        return false;
    }

    public function disconnection(int $fd): void
    {
        if (isset($this->connections[$fd])) {
            unset($this->connections[$fd]);
        }
    }

    public function getConnectionUserByFd(int $fd): ?User
    {
        if (isset($this->connections[$fd])) {
            return $this->connections[$fd];
        }
        return null;
    }

    public function getConnections(): array
    {
        $arr = [];
        foreach ($this->connections as $fd => $user) {
            $arr[$fd] = $user->getUserId();
        }
        return $arr;
    }
}