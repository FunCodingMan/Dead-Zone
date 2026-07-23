<?php

namespace App\Realtime\Domain\Model;

class LobbyUser
{
    private int $fd;
    private string $userId;
    private bool $isReady;
    private string $nickname;
    private string $isHost;

    public function __construct(int $fd, string $userId, string $nickname)
    {
        $this->fd = $fd;
        $this->userId = $userId;
        $this->nickname = $nickname;
        $this->isReady = false;
        $this->isHost = false;
    }

    public function getFd(): int
    {
        return $this->fd;
    }

    public function getUserId(): string
    {
        return $this->userId;
    }

    public function getNickname(): string
    {
        return $this->nickname;
    }

    public function isReady(): bool
    {
        return $this->isReady;
    }

    public function setReady(bool $isReady): void
    {
        $this->isReady = $isReady;
    }
    public function isHost(): bool {
        return $this->isHost;
    }
    public function setHost(bool $isHost): void {
        $this->isHost = $isHost;
    }
}