<?php

namespace App;

use App\app\model\User;
use App\LobbyUser;
use Random\RandomException;

class Room
{
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
        foreach ($this->lobbyUsers as $fd => $lobbyUser) {
            $users[] = $lobbyUser->getNickname();
        }
        $state['users'] = $users;
        $state['countUsers'] = $this->getCountUsers();
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
}