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
            'join-room' => $this->joinRoom($data["fd"], $data["data"]["roomId"]),
            'exit-room' => $this->exitUser($data["fd"]),
            'ready' => $this->readyUser($data["fd"], $data["data"]["isReady"]),
            default => null,
        };
    }

    private function readyUser(int $fd, bool $isReady): void
    {
        if (!isset($this->fdToRoomId[$fd])) return;
        $roomId = $this->fdToRoomId[$fd];
        $room = $this->rooms[$roomId];
        $room->setReadyUser($fd, $isReady);
        $this->updateStateRoom($room);
    }

    private function createRoom(int $fd): void
    {
        if (isset($this->fdToRoomId[$fd])) {
            return;
        }

        $room = new Room();
        $roomId = $room->getRoomId();
        $user = $this->connection->getConnectionUserByFd($fd);
        if ($user === null) {
            return;
        }
        $room->addUser($fd, $user);
        $this->rooms[$roomId] = $room;
        $this->fdToRoomId[$fd] = $roomId;
        $this->ws->send($fd, ["type" => "yourRoomId", "payload" => ["room-id" => $roomId]]);
    }

    private function joinRoom(int $fd, string $roomId): void
    {
        if (!isset($this->rooms[$roomId]) || isset($this->fdToRoomId[$fd]) || $this->rooms[$roomId]->getCountUsers() >= 4) {
            return;
        }

        $room = $this->rooms[$roomId];
        $user = $this->connection->getConnectionUserByFd($fd);
        if ($user === null) {
            return;
        }

        $room->addUser($fd, $user);
        $this->fdToRoomId[$fd] = $roomId;
        $this->updateStateRoom($room);
    }

    public function exitUser(int $fd): void
    {
        if (isset($this->fdToRoomId[$fd])) {
            $roomId = $this->fdToRoomId[$fd];
            $room = $this->rooms[$roomId];
            $room->deleteUser($fd);
            unset($this->fdToRoomId[$fd]);
            if ($room->getCountUsers() >= 1) {
                $this->updateStateRoom($room);
            } else {
                unset($this->rooms[$roomId]);
            }
        }
    }

    public function updateStateRoom(Room $room): void
    {
        $state = $room->getStateRoom();
        $fds = $room->getFdUsers();
        foreach ($fds as $fd) {
            $this->ws->send($fd, ["type" => "stateRoom", "payload" => $state]);
        }
    }

    public function debugState(): array
    {
        $result = [];
        foreach ($this->rooms as $roomId => $room) {
            $result[$roomId] = [
                'state' => $room->getStateRoom(),
            ];
        }
        return [
            'rooms' => $result,
            'fdToRoomId' => $this->fdToRoomId,
        ];
    }

}