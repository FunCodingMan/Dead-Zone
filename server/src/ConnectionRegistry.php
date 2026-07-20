<?php

namespace App;

use App\app\model\User;
use App\app\repository\IUserRepository;

class ConnectionRegistry
{
    /** @var User[] $connections */
    private array $connections;
    private IUserRepository $repository;

    public function __construct(IUserRepository $repository)
    {
        $this->connections = [];
        $this->repository = $repository;
    }

    public function register(int $fd, ?array $cookie): bool
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

    public function unregister(int $fd): void
    {
        if (isset($this->connections[$fd])) {
            unset($this->connections[$fd]);
        }
    }

    public function getUser(int $fd): ?User
    {
        if (isset($this->connections[$fd])) {
            return $this->connections[$fd];
        }
        return null;
    }
}