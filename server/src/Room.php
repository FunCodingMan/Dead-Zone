<?php

namespace App;

use App\app\model\User;
use App\LobbyUser;
use Random\RandomException;

class Room
{
    const int MAX_COUNT_USERS = 4;
    /** @var LobbyUser[] $lobbyUsers */
    private array $lobbyUsers;
    private string $roomId;

    /**
     * @throws RandomException
     */
    public function __construct()
    {
        $this->lobbyUsers = [];
        $this->roomId = bin2hex(random_bytes(8));
    }

    public function addUser(int $fd, User $user): void
    {
        $lobbyUser = new LobbyUser($fd, $user->getUserId(), $user->getNickname());
        $this->lobbyUsers[$fd] = $lobbyUser;
    }

    public function getStateRoom(): array
    {
        $state = [];
        $users = [];
        foreach ($this->lobbyUsers as $lobbyUser) {
            $users[] = ["nickname" => $lobbyUser->getNickname(), "isReady" => $lobbyUser->isReady()];
        }

        $state['users'] = $users;
        $state['countUsers'] = $this->getCountUsers();
        $state["maxCountUsers"] = self::MAX_COUNT_USERS;
        return $state;
    }

    public function getRoomId(): string
    {
        return $this->roomId;
    }

    public function deleteUser(int $fd): void
    {
        unset($this->lobbyUsers[$fd]);
    }

    public function getCountUsers(): int
    {
        return count($this->lobbyUsers);
    }

    public function getFdUsers(): array
    {
        return array_keys($this->lobbyUsers);
    }

    public function setReadyUser(int $fd, bool $isReady): void
    {
        $lobbyUser = $this->lobbyUsers[$fd];
        $lobbyUser->setReady($isReady);
    }
}