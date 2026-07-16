<?php

class LobbyUser
{
    private int $fd;
    private int $userId;
    private bool $ready;

    public function __construct(int $fd, int $userId)
    {
        $this->fd = $fd;
        $this->userId = $userId;
        $this->ready = false;
    }

    public function getReady(): bool
    {
        return $this->ready;
    }

    public function getFd(): int
    {
        return $this->fd;
    }

    public function getUserId(): int
    {
        return $this->userId;
    }

    public function ready(): void
    {
        $this->ready = true;
    }

    public function unready(): void
    {
        $this->ready = false;
    }
}