<?php

namespace App;

class Lobby
{
    /** @var Room[] $rooms */
    private array $rooms;
    private ConnectionUser $connection;
    private WebSocketParser $ws;

    public function __construct(WebSocketParser $ws, ConnectionUser $connection)
    {
        $this->rooms = [];
        $this->ws = $ws;
        $this->connection = $connection;
    }

    public function handler(array $data): void
    {
        match ($data['type']) {
            'create-room' => $this->createRoom($data["fd"]),
            default => null,
        };
    }

    private function createRoom(int $fd): void
    {
        $room = new Room();
        $user = $this->connection->getConnectionByFd($fd);
        if (!isset($user)) {
            return;
        }
        $room->addUser($fd, $user);



    }

}