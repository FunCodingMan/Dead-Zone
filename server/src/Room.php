<?php

namespace App;

use App\app\game\GameEngine;
use App\app\game\GameConfig;
use App\app\game\GameMap;
use App\app\model\User;
use Random\RandomException;

class Room
{
    /** @var LobbyUser[] $lobbyUsers */
    private array $lobbyUsers;
    private string $roomId;
    private PlayerRegistry $registry;
    private GameEngine $gameEngine;
    private MessageQueue $queue;
    private bool $isStart;


    /** @throws RandomException */
    public function __construct(WebSocketTransport $ws)
    {
        $this->isStart = false;
        $this->lobbyUsers = [];
        $this->roomId = bin2hex(random_bytes(8));
        $map = new GameMap();
        $map->loadLevel(LevelRepository::get(LevelRepository::getDefaultId()));
        $this->registry = new PlayerRegistry();
        $this->queue = new MessageQueue();
        $this->gameEngine = new GameEngine($ws, $this->registry, $this->queue, $map);
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
        $state['roomId'] = $this->roomId;
        $state['users'] = $users;
        $state['countUsers'] = $this->getCountUsers();
        $state["maxCountUsers"] = GameConfig::MAX_COUNT_USERS;
        return $state;
    }

    public function getRoomId(): string
    {
        return $this->roomId;
    }

    public function deleteUser(int $fd): void
    {
        unset($this->lobbyUsers[$fd]);

        $this->registry->removePlayer($fd);
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

    public function hasMaxUsers(): bool
    {
        if (count($this->lobbyUsers) < GameConfig::MAX_COUNT_USERS) return false;
        return true;
    }

    public function isAllReady(): bool
    {
        foreach ($this->lobbyUsers as $lobbyUser) {
            if (!$lobbyUser->isReady()) return false;
        }
        return true;
    }

    public function startGame(): void
    {
        if ($this->isStart) return;
        foreach ($this->lobbyUsers as $lobbyUser) {
            $this->registry->addPlayer($lobbyUser->getFd(), $lobbyUser->getUserId(), $lobbyUser->getNickname());
        }
        $this->gameEngine->spawnPlayers();
        $this->isStart = true;
    }

    public function isStarted(): bool
    {
        return $this->isStart;
    }

    public function updateGameState(): void
    {
        $this->gameEngine->pushData();
    }

    public function receiveInput(int $fd, string $type, array $payload): void
    {
        $this->queue->enqueue($fd, $type, $payload);
    }
}