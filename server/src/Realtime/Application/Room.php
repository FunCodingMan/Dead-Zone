<?php

namespace App\Realtime\Application;

use App\Realtime\Domain\LevelRepository;
use App\Realtime\Domain\Map\GameConfig;
use App\Realtime\Domain\Map\GameMap;
use App\Realtime\Domain\Model\LobbyUser;
use App\Realtime\Infrastructure\WebSocketTransport;
use App\Site\app\model\User;
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
    private bool $isFogEnabled;


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
        $this->isFogEnabled = GameConfig::IS_FOG_ACTIVE;
        $this->gameEngine->setFogOfWar($this->isFogEnabled);
    }

    public function addUser(int $fd, User $user): void
    {
        $lobbyUser = new LobbyUser($fd, $user->getUserId(), $user->getNickname());

        if (empty($this->lobbyUsers)) {
            $lobbyUser->setHost(true);
        }

        $this->lobbyUsers[$fd] = $lobbyUser;
    }

    public function getStateRoom(): array
    {
        $state = [];
        $users = [];
        foreach ($this->lobbyUsers as $lobbyUser) {
            $users[] = [
                "nickname" => $lobbyUser->getNickname(),
                "isReady" => $lobbyUser->isReady(),
                "isHost" => $lobbyUser->isHost()
            ];
        }
        $state['roomId'] = $this->roomId;
        $state['users'] = $users;
        $state['countUsers'] = $this->getCountUsers();
        $state["maxCountUsers"] = GameConfig::MAX_COUNT_USERS;
        $state['isFogEnabled'] = $this->isFogEnabled;
        return $state;
    }

    public function getRoomId(): string
    {
        return $this->roomId;
    }

    public function deleteUser(int $fd): void
    {
        $wasHost = $this->isUserHost($fd);

        if ($this->isStart) {
            $this->gameEngine->saveDisconnectedPlayerStats($fd);
        }

        unset($this->lobbyUsers[$fd]);
        $this->registry->removePlayer($fd);

        if ($wasHost && !empty($this->lobbyUsers)) {
            $firstFd = array_key_first($this->lobbyUsers);
            $this->lobbyUsers[$firstFd]->setHost(true);
        }
    }

    public function isUserHost(int $fd): bool
    {
        return isset($this->lobbyUsers[$fd]) && $this->lobbyUsers[$fd]->isHost();
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
    public function setFogEnabled(bool $enabled): void
    {
        $this->isFogEnabled = $enabled;
        $this->gameEngine->setFogOfWar($enabled);
    }
    public function isFogEnabled(): bool
    {
        return $this->isFogEnabled;
    }


}