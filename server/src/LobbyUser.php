<?php

namespace App;

class LobbyUser
{
    private int $fd;
    private string $userId;
    private bool $isReady;

    public function __construct(int $fd, string $userId)
    {
        $this->fd = $fd;
        $this->userId = $userId;
        $this->isReady = false;
    }

    public function ready(): void
    {
        $this->isReady = true;
    }

    public function unready(): void
    {
        $this->isReady = false;
    }
}