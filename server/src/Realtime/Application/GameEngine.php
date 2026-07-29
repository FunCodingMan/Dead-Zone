<?php

namespace App\Realtime\Application;

use App\Realtime\Domain\Combat\VisibilityService;
use App\Realtime\Domain\Map\GameConfig;
use App\Realtime\Domain\Map\GameMap;
use App\Realtime\Domain\Mode\GameModeInterface;
use App\Realtime\Infrastructure\WebSocketTransport;
use App\Site\app\repository\IUserRepository;

class GameEngine
{
    private WebSocketTransport $ws;
    private PlayerRegistry $registry;
    private GameMap $map;
    private MessageQueue $queue;
    private CombatService $combat;
    private VisibilityService $visibility;
    private MatchLifecycle $lifecycle;
    private MatchResultNotifier $resultNotifier;
    private array $disconnectedStats = [];
    private GameModeInterface $gameMode;
    private bool $isBetweenRounds = false;
    private float $nextRoundTime = 0.0;
    private bool $isMatchEnded = false;
    private MedkitManager $medkitManager;

    public function __construct(WebSocketTransport $ws, PlayerRegistry $registry, MessageQueue $queue, GameMap $map, IUserRepository $userRepository, GameModeInterface $gameMode, $matchDuration = GameConfig::MATCH_DURATION_S)
    {
        $this->gameMode = $gameMode;
        $this->ws = $ws;
        $this->map = $map;
        $this->registry = $registry;
        $this->queue = $queue;
        $this->visibility = new VisibilityService($map);
        $this->lifecycle = new MatchLifecycle($matchDuration);
        $this->resultNotifier = new MatchResultNotifier($this->ws, $this->registry, $userRepository, $this->gameMode);
        $this->combat = new CombatService($this->ws, $this->registry, $map, $this->gameMode);
        $this->medkitManager = new MedkitManager($map);
    }

    public function pushData(): void
    {
        $now = microtime(true);
        if ($this->lifecycle->isOver($now) || $this->gameMode->isMatchOver()) {
            if (!$this->lifecycle->getSumUp()) {
                $this->endMatch();
                $this->lifecycle->setSumUp(true);
            }
        }
        if ($this->isBetweenRounds && $now >= $this->nextRoundTime) {
            $this->startNewRound();
        }

        $this->applyQueuedInput($now);

        $players = $this->registry->getPlayers();
        if ($this->gameMode->isRespawnAllowed()) {
            $this->checkRespawn($players, $now);
        }

        foreach ($players as $player) {
            $player->applyMovement($this->map);
        }

        if (!$this->isBetweenRounds) {
            $this->medkitManager->update($now, $players, $this->gameMode);
            $roundWinner = $this->gameMode->checkRoundState($players);
            if ($roundWinner !== null) {
                if ($this->gameMode->isMatchOver()) {
                    $this->endMatch();
                } else {
                    $this->handleRoundEnd($roundWinner, $now);
                }
            }
        }

        $this->broadcastCurrentState($now);
    }

    private function broadcastCurrentState(float $now): void
    {
        $players = $this->registry->getPlayers();
        $allMedkits = $this->medkitManager->getPublicState();
        foreach ($players as $player) {
            $others = $this->visibility->getVisiblePlayers($player, $players);
            $this->registry->sendVisiblePlayers($player, $others);
            $visibleMedkits = $this->visibility->getVisibleMedkits($player, $allMedkits);
            $this->registry->sendVisibleMedkits($player, $visibleMedkits);
        }

        $visiblePlayers = $this->registry->getVisiblePlayers();
        $this->ws->broadcastGameState($visiblePlayers, $this->lifecycle->getTimeLeft($now));
    }

    private function handleRoundEnd(string $winnerTeam, float $now): void
    {
        $this->isBetweenRounds = true;
        $this->nextRoundTime = $now + GameConfig::PAUSE_BETWEEN_ROUNDS_S;

        $payload = [
            'winnerTeam' => $winnerTeam,
            'scores' => $this->gameMode->getScores()
        ];

        foreach ($this->registry->getPlayers() as $player) {
            $this->ws->send($player->getFd(), [
                'type' => 'round_end',
                'payload' => $payload
            ]);
        }
    }

    public function isMatchEnded(): bool
    {
        return $this->isMatchEnded;
    }

    private function startNewRound(): void
    {
        $this->isBetweenRounds = false;
        $players = $this->registry->getPlayers();

        foreach ($players as $player) {
            $spawn = $this->gameMode->getSpawnPoint($player, $this->map);
            $player->respawn($spawn['x'], $spawn['y']);
        }

        foreach ($players as $player) {
            $this->ws->send($player->getFd(), [
                'type' => 'round_start',
                'payload' => []
            ]);
        }
    }

    public function setFogOfWar(bool $enabled): void
    {
        $this->visibility->setFogOfWar($enabled);
    }

    public function saveDisconnectedPlayerStats(int $fd): void
    {
        $player = $this->registry->getPlayerByFd($fd);

        if ($player !== null) {
            $kills = $player->getKills() ?? 0;
            $deaths = $player->getDeaths() ?? 0;

            if ($deaths === 0) {
                $kd = $kills;
            } else {
                $kd = $kills / $deaths;
            }

            $kdFormatted = number_format($kd, 2, '.', '');

            $this->disconnectedStats[] = [
                'nickname' => $player->getNickname(),
                'kills'    => $kills,
                'deaths'   => $deaths,
                'kd'       => $kdFormatted,
                'team'     => $player->getTeam()
            ];
        }
    }

    public function setMatchDuration(float $duration): void
    {
        $this->lifecycle->setDuration($duration);
    }

    public function setGameMode(GameModeInterface $mode): void
    {
        $this->gameMode = $mode;
        $this->combat->setMode($this->gameMode);
        $this->resultNotifier->setMode($this->gameMode);
    }

    public function spawnPlayers(): void
    {
        $this->lifecycle->start(microtime(true));
        $players = $this->registry->getPlayers();

        $this->gameMode->assignTeams($players);

        foreach ($players as $player) {
            $spawn = $this->gameMode->getSpawnPoint($player, $this->map);
            $player->setPos($spawn['x'], $spawn['y']);
        }
    }

    private function checkRespawn(array $players, float $now): void
    {
        foreach ($players as $player) {
            if ($player->isDead()) {
                if (($now - $player->getDeathTime()) >= GameConfig::RESPAWN_TIME_S) {
                    $spawn = $this->gameMode->getSpawnPoint($player, $this->map);
                    $player->respawn($spawn['x'], $spawn['y']);
                }
            }
        }
    }

    private function applyQueuedInput(float $now): void
    {
        $arrData = $this->queue->dequeueAll();
        if (empty($arrData)) return;

        foreach ($arrData as $data) {
            $player = $this->registry->getPlayerByFd($data["fd"]);
            if (empty($player) || $player->isDead()) continue;

            match ($data["type"]) {
                'move' => $player->setInput($data["payload"]["keys"], (float)$data["payload"]["angle"]),
                'shot' => $this->combat->handleShot($player, $data["payload"], $now),
                'reload' => $player->startReload($now),
                default => null
            };
        }
    }

    private function endMatch(): void
    {
        if ($this->isMatchEnded) {
            return;
        }
        $this->isMatchEnded = true;
        $this->lifecycle->markEnded();
        $this->resultNotifier->notifyGameOver($this->disconnectedStats);
    }
}