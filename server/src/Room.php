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
        $this->roomId = bin2hex(random_bytes(32));
    }

    public function addUser(int $fd, User $user): void
    {
        $lobbyUser = new LobbyUser($fd, $user->getUserId());
        $this->lobbyUsers[$fd] = $lobbyUser;
    }

    public function getRoomId(): string
    {
        return $this->roomId;
    }
}