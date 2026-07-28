<?php

namespace App\Realtime\Application;

use App\Realtime\Domain\LevelRepository;
use App\Realtime\Domain\Map\GameConfig;
use App\Realtime\Domain\Map\GameMap;
use App\Realtime\Domain\Mode\DeathMatchMode;
use App\Realtime\Domain\Mode\GameModeInterface;
use App\Realtime\Domain\Mode\RoundBasedTeamMode;
use App\Realtime\Domain\Mode\TeamDeathMatchMode;
use App\Realtime\Domain\Model\LobbyUser;
use App\Realtime\Infrastructure\WebSocketTransport;
use App\Site\app\model\User;
use App\Site\app\repository\IUserRepository;
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
    private int $matchDuration;
    private GameModeInterface $mode;
    private string $modeType = GameConfig::MODE_DEATHMATCH;
    private bool $isClassSelectionEnabled = true;
    private string $globalClassName = GameConfig::SOLDIER_CLASS;
    private WebSocketTransport $ws;
    private IUserRepository $userRepository;


    /** @throws RandomException */
    public function __construct(WebSocketTransport $ws, IUserRepository $userRepository)
    {
        $this->ws = $ws;
        $this->userRepository = $userRepository;
        $this->isStart = false;
        $this->lobbyUsers = [];
        $this->roomId = bin2hex(random_bytes(8));
        $this->isFogEnabled = GameConfig::IS_FOG_ACTIVE;
        $this->matchDuration = (int)GameConfig::MATCH_DURATION_S;

        $this->initEngine();
    }

    private function initEngine(): void
    {
        if ($this->modeType === GameConfig::MODE_ELIMINATION) {
            $this->mode = new RoundBasedTeamMode();
        } elseif ($this->modeType === GameConfig::MODE_TEAM_DEATHMATCH) {
            $this->mode = new TeamDeathMatchMode();
        } else if ($this->modeType === GameConfig::MODE_DEATHMATCH){
            $this->mode = new DeathMatchMode();
        }

        $map = new GameMap();
        $map->loadLevel(LevelRepository::get(LevelRepository::getDefaultId()));
        $this->registry = new PlayerRegistry();
        $this->queue = new MessageQueue();

        $this->gameEngine = new GameEngine($this->ws, $this->registry, $this->queue, $map, $this->userRepository, $this->mode);
        $this->gameEngine->setFogOfWar($this->isFogEnabled);
        $this->gameEngine->setMatchDuration((float)$this->matchDuration);
    }

    public function resetRoom(): void
    {
        $this->isStart = false;
        foreach ($this->lobbyUsers as $user) {
            $user->setReady(false);
        }

        $this->initEngine();
    }

    public function addUser(int $fd, User $user): void
    {
        $lobbyUser = new LobbyUser($fd, $user->getUserId(), $user->getNickname());

        if (!$this->isClassSelectionEnabled) {
            $lobbyUser->setClassName($this->globalClassName);
        } else {
            $lobbyUser->setClassName(GameConfig::SOLDIER_CLASS);
        }

        if (empty($this->lobbyUsers)) {
            $lobbyUser->setHost(true);
        }

        if (in_array($this->modeType, [GameConfig::MODE_ELIMINATION, GameConfig::MODE_TEAM_DEATHMATCH], true)) {
            $redCount = 0;
            $blueCount = 0;
            foreach ($this->lobbyUsers as $existingUser) {
                if ($existingUser->getTeam() === GameConfig::TEAM_RED) $redCount++;
                if ($existingUser->getTeam() === GameConfig::TEAM_BLUE) $blueCount++;
            }
            $lobbyUser->setTeam($redCount <= $blueCount ? GameConfig::TEAM_RED : GameConfig::TEAM_BLUE);
        } else {
            $lobbyUser->setTeam(GameConfig::TEAM_NONE);
        }

        $this->lobbyUsers[$fd] = $lobbyUser;
    }
    public function canStartTeamGame(): bool
    {
        if (in_array($this->modeType, [GameConfig::MODE_ELIMINATION, GameConfig::MODE_TEAM_DEATHMATCH], true)) {
            $redCount = 0;
            $blueCount = 0;

            foreach ($this->lobbyUsers as $user) {
                if ($user->getTeam() === GameConfig::TEAM_RED) {
                    $redCount++;
                } elseif ($user->getTeam() === GameConfig::TEAM_BLUE) {
                    $blueCount++;
                }
            }
            return $redCount > 0 && $blueCount > 0;
        }

        return true;
    }

    public function changeModeType(string $newMode): bool
    {
        if ($this->isStart || !in_array($newMode, [GameConfig::MODE_DEATHMATCH, GameConfig::MODE_ELIMINATION, GameConfig::MODE_TEAM_DEATHMATCH], true)) {
            return false;
        }

        if ($this->modeType === $newMode) {
            return true;
        }

        $this->modeType = $newMode;
        $this->initEngine();

        if (in_array($this->modeType, [GameConfig::MODE_ELIMINATION, GameConfig::MODE_TEAM_DEATHMATCH], true)) {
            $isRed = true;
            foreach ($this->lobbyUsers as $user) {
                $user->setTeam($isRed ? GameConfig::TEAM_RED : GameConfig::TEAM_BLUE);
                $isRed = !$isRed;
            }
        } else {
            foreach ($this->lobbyUsers as $user) {
                $user->setTeam(GameConfig::TEAM_NONE);
            }
        }

        $this->gameEngine->setGameMode($this->mode);

        return true;
    }

    public function switchUserTeam(int $fd, string $targetTeam): bool
    {
        if (!in_array($this->modeType, [GameConfig::MODE_ELIMINATION, GameConfig::MODE_TEAM_DEATHMATCH], true) || !in_array($targetTeam, [GameConfig::TEAM_RED, GameConfig::TEAM_BLUE], true)) {
            return false;
        }

        $currentUser = $this->lobbyUsers[$fd] ?? null;

        if (!$currentUser || $currentUser->getTeam() === $targetTeam) {
            return false;
        }

        $currentUser->setTeam($targetTeam);
        return true;
    }
    public function changeUserClass(int $fd, string $className): bool
    {
        if ($this->isStart || !in_array($className, [GameConfig::SOLDIER_CLASS, GameConfig::FLAME_THROWER_CLASS], true)) {
            return false;
        }

        if (!$this->isClassSelectionEnabled) {
            if ($this->isUserHost($fd)) {
                $this->globalClassName = $className;
                foreach ($this->lobbyUsers as $user) {
                    $user->setClassName($className);
                }
                return true;
            }
            return false;
        }

        $currentUser = $this->lobbyUsers[$fd] ?? null;

        if (!$currentUser || $currentUser->getClassName() === $className) {
            return false;
        }

        $currentUser->setClassName($className);
        return true;
    }

    public function setClassSelectionEnabled(int $fd, bool $isEnabled): bool
    {
        if ($this->isStart || !$this->isUserHost($fd)) {
            return false;
        }

        $this->isClassSelectionEnabled = $isEnabled;

        if (!$this->isClassSelectionEnabled) {
            $hostClass = $this->lobbyUsers[$fd]->getClassName();
            $this->globalClassName = $hostClass;

            foreach ($this->lobbyUsers as $user) {
                $user->setClassName($this->globalClassName);
            }
        }
        return true;
    }

    public function getStateRoom(): array
    {
        $state = [];
        $users = [];
        foreach ($this->lobbyUsers as $lobbyUser) {
            $users[] = [
                "nickname" => $lobbyUser->getNickname(),
                "isReady" => $lobbyUser->isReady(),
                "isHost" => $lobbyUser->isHost(),
                "team" => $lobbyUser->getTeam(),
                "className" => $lobbyUser->getClassName()
            ];
        }
        $state['roomId'] = $this->roomId;
        $state['users'] = $users;
        $state['countUsers'] = $this->getCountUsers();
        $state["maxCountUsers"] = GameConfig::MAX_COUNT_USERS;
        $state['isFogEnabled'] = $this->isFogEnabled;
        $state['matchDuration'] = $this->matchDuration;
        $state['modeType'] = $this->modeType;
        $state['isClassSelectionEnabled'] = $this->isClassSelectionEnabled;
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
            $player = $this->registry->addPlayer($lobbyUser->getFd(), $lobbyUser->getUserId(), $lobbyUser->getNickname());

            $player->setTeam($lobbyUser->getTeam());
            $player->setClassName($lobbyUser->getClassName());
        }
        $this->gameEngine->spawnPlayers();
        $this->isStart = true;
    }

    public function isMatchEnded(): bool
    {
        return $this->gameEngine->isMatchEnded();
    }

    public function isStarted(): bool
    {
        return $this->isStart && !$this->gameEngine->isMatchEnded();
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
    public function setMatchDuration(int $duration): void
    {
        $this->matchDuration = $duration;
        $this->gameEngine->setMatchDuration((float)$duration);
    }


}