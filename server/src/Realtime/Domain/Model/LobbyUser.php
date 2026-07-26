<?php

namespace App\Realtime\Domain\Model;

use App\Realtime\Domain\Map\GameConfig;

class LobbyUser
{
    private int $fd;
    private string $userId;
    private bool $isReady;
    private string $nickname;
    private string $isHost;
    private string $team = GameConfig::TEAM_NONE;

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
    public function setTeam(string $team): void {
        $this->team = $team;
    }

    public function getTeam(): string {
        return $this->team;
    }
}