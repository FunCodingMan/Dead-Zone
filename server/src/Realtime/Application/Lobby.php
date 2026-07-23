<?php

namespace App\Realtime\Application;

use App\Realtime\Domain\Map\GameConfig;
use App\Realtime\Infrastructure\ConnectionRegistry;
use App\Realtime\Infrastructure\WebSocketTransport;

class Lobby
{
    /** @var Room[] $rooms */
    /** @var int[] $fdToRoomId */
    private array $rooms;
    private array $fdToRoomId;
    private ConnectionRegistry $connection;
    private WebSocketTransport $ws;

    public function __construct(WebSocketTransport $ws, ConnectionRegistry $connection)
    {
        $this->rooms = [];
        $this->fdToRoomId = [];
        $this->ws = $ws;
        $this->connection = $connection;
    }

    public function handleMessage(array $data): void
    {
        match ($data['type']) {
            'create-room' => $this->createRoom($data["fd"]),
            'join-room' => $this->joinRoom($data["fd"], $data["payload"]["roomId"]),
            'exit-room' => $this->exitUser($data["fd"]),
            'ready' => $this->readyUser($data["fd"], $data["payload"]["isReady"]),
            'start-game' => $this->startGame($data["fd"]),
            'move', 'shot', 'reload' => $this->handleGameData($data["fd"], $data["type"], $data["payload"]),
            default => null,
        };
    }

    public function handleGameData(int $fd, string $type, array $payload): void
    {
        echo $type;
        $roomId = $this->fdToRoomId[$fd] ?? null;
        if ($roomId === null) return;
        $room = $this->rooms[$roomId] ?? null;
        if ($room === null) return;
        if ($room->isStarted()) {
            $room->receiveInput($fd, $type, $payload);
        }
    }

    public function updateActiveRooms(): void
    {
        foreach ($this->rooms as $room) {
            if ($room->isStarted()) {
                $room->updateGameState();
            }
        }
    }

    private function startGame(int $fd): void
    {
        $roomId = $this->fdToRoomId[$fd] ?? null;
        if ($roomId === null) return;
        $room = $this->rooms[$roomId];

        if (!$room->isUserHost($fd)) {
            echo "Только хост может начать игру!\n";
            return;
        }

        if (!$room->isAllReady()) {
            echo "Не все игроки приготовились!\n";
            return;
        }

        $room->startGame();
        foreach ($room->getFdUsers() as $fdUser) {
            $this->ws->send($fdUser, ["type" => "start-game", "payload" => []]);
        }
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
        $room = new Room($this->ws);
        $roomId = $room->getRoomId();
        $user = $this->connection->getUser($fd);
        if ($user === null) {
            return;
        }
        $room->addUser($fd, $user);
        $this->rooms[$roomId] = $room;
        $this->fdToRoomId[$fd] = $roomId;
        $this->updateStateRoom($room);
    }

    private function joinRoom(int $fd, string $roomId): void
    {
        if (isset($this->fdToRoomId[$fd])) return;
        $room = $this->rooms[$roomId] ?? null;
        if ($room === null) {
            $this->ws->send($fd, ["type" => "join-error", "payload" => ["message" => "Комната не найдена"]]);
            return;
        }
        if ($room->getCountUsers() >= GameConfig::MAX_COUNT_USERS) {
            $this->ws->send($fd, ["type" => "join-error", "payload" => ["message" => "Комната заполнена"]]);
            return;
        }
        $user = $this->connection->getUser($fd);
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
            $personalState = $state;
            $personalState['amIHost'] = $room->isUserHost($fd);
            $this->ws->send($fd, ["type" => "stateRoom", "payload" => $personalState]);
        }
    }
}