<?php

namespace App;

class Lobby
{
    /** @var Room[] $rooms */
    /** @var int[] $fdToRoomId */
    private array $rooms;
    private array $fdToRoomId;
    private ConnectionUser $connection;
    private WebSocketParser $ws;

    public function __construct(WebSocketParser $ws, ConnectionUser $connection)
    {
        $this->rooms = [];
        $this->fdToRoomId = [];
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
        if (isset($this->fdToRoomId[$fd])) {
            return;
        }

        $room = new Room();
        $roomId = $room->getRoomId();
        $user = $this->connection->getConnectionByFd($fd);
        if (!$user === null) {
            return;
        }
        $room->addUser($fd, $user);
        $this->rooms[$roomId] = $room;
        $this->fdToRoomId[$fd] = $roomId;
        $this->ws->send($fd, ["type" => "getRoomId", "payload" => ["room-id" => $roomId]]);
    }

    public function exitUser(int $fd): void
    {
        if (isset($this->fdToRoomId[$fd])) {
            $roomId = $this->fdToRoomId[$fd];
            $room = $this->rooms[$roomId];
            $room->deleteUser($fd);
            unset($this->fdToRoomId[$fd]);
            if ($room->getCountUsers() < 1) {
                unset($this->rooms[$roomId]);
            }
        }
    }

    public function debugState(): array
    {
        $result = [];
        foreach ($this->rooms as $roomId => $room) {
            $result[$roomId] = [
                'playersCount' => $room->getCountUsers(),
            ];
        }
        return [
            'rooms' => $result,
            'fdToRoomId' => $this->fdToRoomId,
        ];
    }

}