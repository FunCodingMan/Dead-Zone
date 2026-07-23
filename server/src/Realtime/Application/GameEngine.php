<?php

namespace App\Realtime\Application;

use App\Realtime\Domain\Combat\VisibilityService;
use App\Realtime\Domain\Map\GameConfig;
use App\Realtime\Domain\Map\GameMap;
use App\Realtime\Infrastructure\WebSocketTransport;

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

    public function __construct(WebSocketTransport $ws, PlayerRegistry $registry, MessageQueue $queue, GameMap $map)
    {
        $this->ws = $ws;
        $this->map = $map;
        $this->registry = $registry;
        $this->queue = $queue;
        $this->visibility = new VisibilityService($map);
        $this->combat = new CombatService($this->ws, $this->registry, $map);
        $this->lifecycle = new MatchLifecycle();
        $this->resultNotifier = new MatchResultNotifier($this->ws, $this->registry);
    }

    public function pushData(): void
    {
        $now = microtime(true);
        if ($this->lifecycle->isOver($now)) {
            $this->endMatch();
            return;
        }

        $this->applyQueuedInput($now);

        $players = $this->registry->getPlayers();
        $this->checkRespawn($players, $now);

        foreach ($players as $player) {
            $player->applyMovement($this->map);
        }

        foreach ($players as $player) {
            $others = $this->visibility->getVisiblePlayers($player, $players);
            $this->registry->sendVisiblePlayers($player, $others);
        }

        $visiblePlayers = $this->registry->getVisiblePlayers();
        $this->ws->broadcastGameState($visiblePlayers, $this->lifecycle->getTimeLeft($now));
    }
    public function setFogOfWar(bool $enabled): void
    {
        $this->visibility->setFogOfWar($enabled);
    }
    public function saveDisconnectedPlayerStats(int $fd): void
    {
        $player = $this->registry->getPlayerByFd($fd);

        if ($player !== null) {
            $this->disconnectedStats[] = [
                'nickname' => $player->getNickname(),
                'kills'    => $player->getKills(),
                'deaths'   => $player->getDeaths()
            ];
        }
    }


    public function spawnPlayers(): void
    {
        $this->lifecycle->start(microtime(true));
        $players = $this->registry->getPlayers();
        foreach ($players as $player) {
            $spawn = $this->map->findFreeSpawn(GameConfig::SYMBOL_PLAYER);
            $player->setPos($spawn['x'], $spawn['y']);
        }
    }

    private function checkRespawn(array $players, float $now): void
    {
        foreach ($players as $player) {
            if ($player->isDead()) {
                if (($now - $player->getDeathTime()) >= GameConfig::RESPAWN_TIME_S) {
                    $spawn = $this->map->findFreeSpawn(GameConfig::SYMBOL_PLAYER);
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
        $this->lifecycle->markEnded();
        $this->resultNotifier->notifyGameOver($this->disconnectedStats);
    }
}