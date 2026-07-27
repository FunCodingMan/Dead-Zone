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


    /** @throws RandomException */
    public function __construct(WebSocketTransport $ws)
    {
        if ($this->modeType === GameConfig::MODE_ROUND_BASED) {
            $this->mode = new RoundBasedTeamMode();
        } elseif ($this->modeType === GameConfig::MODE_TDM) {
            $this->mode = new TeamDeathMatchMode();
        } else {
            $this->mode = new DeathMatchMode();
        }
        $this->isStart = false;
        $this->lobbyUsers = [];
        $this->roomId = bin2hex(random_bytes(8));
        $map = new GameMap();
        $map->loadLevel(LevelRepository::get(LevelRepository::getDefaultId()));
        $this->registry = new PlayerRegistry();
        $this->queue = new MessageQueue();
        $this->gameEngine = new GameEngine($ws, $this->registry, $this->queue, $map, $this->mode);
        $this->isFogEnabled = GameConfig::IS_FOG_ACTIVE;
        $this->gameEngine->setFogOfWar($this->isFogEnabled);
        $this->matchDuration = (int)GameConfig::MATCH_DURATION_S;
    }

    public function addUser(int $fd, User $user): void
    {
        $lobbyUser = new LobbyUser($fd, $user->getUserId(), $user->getNickname());

        if (empty($this->lobbyUsers)) {
            $lobbyUser->setHost(true);
        }

        if (in_array($this->modeType, [GameConfig::MODE_TDM, GameConfig::MODE_ROUND_BASED], true)) {
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

    public function changeModeType(string $newMode): bool
    {
        if ($this->isStart || !in_array($newMode, [GameConfig::MODE_DEATHMATCH, GameConfig::MODE_TDM, GameConfig::MODE_ROUND_BASED], true)) {
            return false;
        }

        if ($this->modeType === $newMode) {
            return true;
        }

        $this->modeType = $newMode;

        if ($this->modeType === GameConfig::MODE_ROUND_BASED) {
            $this->mode = new RoundBasedTeamMode();
        } elseif ($this->modeType === GameConfig::MODE_TDM) {
            $this->mode = new TeamDeathMatchMode();
        } else {
            $this->mode = new DeathMatchMode();
        }

        if (in_array($this->modeType, [GameConfig::MODE_TDM, GameConfig::MODE_ROUND_BASED], true)) {
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
        if (!in_array($this->modeType, [GameConfig::MODE_TDM, GameConfig::MODE_ROUND_BASED], true) || !in_array($targetTeam, [GameConfig::TEAM_RED, GameConfig::TEAM_BLUE], true)) {
            return false;
        }

        $currentUser = $this->lobbyUsers[$fd] ?? null;

        if (!$currentUser || $currentUser->getTeam() === $targetTeam) {
            return false;
        }

        $currentUser->setTeam($targetTeam);
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
                "team" => $lobbyUser->getTeam()
            ];
        }
        $state['roomId'] = $this->roomId;
        $state['users'] = $users;
        $state['countUsers'] = $this->getCountUsers();
        $state["maxCountUsers"] = GameConfig::MAX_COUNT_USERS;
        $state['isFogEnabled'] = $this->isFogEnabled;
        $state['matchDuration'] = $this->matchDuration;
        $state['modeType'] = $this->modeType;
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
        }
        $this->gameEngine->spawnPlayers();
        $this->isStart = true;
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