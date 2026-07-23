<?php

namespace App\Realtime\Application;

use App\Realtime\Domain\Combat\HitscanResolver;
use App\Realtime\Domain\Combat\VisibilityService;
use App\Realtime\Domain\Map\GameConfig;
use App\Realtime\Domain\Map\GameMap;
use App\Realtime\Domain\Model\Player;
use App\Realtime\Infrastructure\WebSocketTransport;

class GameEngine
{
    private WebSocketTransport $ws;
    private PlayerRegistry $registry;
    private GameMap $map;
    private MessageQueue $queue;
    private HitscanResolver $hitscan;
    private VisibilityService $visibility;
    private float $matchStartTime = 0.0;
    private bool $isMatchEnded = false;
    public function __construct(WebSocketTransport $ws, PlayerRegistry $registry, MessageQueue $queue, GameMap $map)
    {
        $this->ws = $ws;
        $this->registry = $registry;
        $this->map = $map;
        $this->queue = $queue;

        $this->hitscan = new HitscanResolver();
        $this->visibility = new VisibilityService($map);
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

    public function pushData(): void
    {
        if ($this->isMatchEnded) return;

        $now = microtime(true);
        $timeLeft = max(0, GameConfig::MATCH_DURATION_S - ($now - $this->matchStartTime));

        if ($timeLeft <= 0) {
            $this->endMatch();
            return;
        }

        $arrData = $this->queue->dequeueAll();
        if (!empty($arrData)) {
            foreach ($arrData as $data) {
                $player = $this->registry->getPlayerByFd($data["fd"]);
                if (!empty($player)) {
                    if ($player->isDead()) {
                        continue;
                    }
                    match ($data["type"]) {
                        'move' => $player->setInput($data["payload"]["keys"], (float)$data["payload"]["angle"]),
                        'shot' => $this->processAttackImpact($player, $data["payload"]),
                        'reload' => $player->startReload(microtime(true)),
                        default => null
                    };
                }
            }
        }
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
        $this->ws->broadcastGameState($visiblePlayers, $timeLeft);
    }


    public function spawnPlayers(): void
    {
        $this->matchStartTime = microtime(true);
        $players = $this->registry->getPlayers();
        foreach ($players as $player) {
            $spawn = $this->map->findFreeSpawn(GameConfig::SYMBOL_PLAYER);
            $player->setPos($spawn['x'], $spawn['y']);
        }
    }

    private function killFeed(Player $shoter, Player $hitPlayer): void
    {
        if ($hitPlayer->getHealth() > 0) return;
        $shoter->increaseKills();
        $hitPlayer->increaseDeaths();
        $message = ["type" => "kill-feed", "payload" => ["killer" => $shoter->getNickname(), "victim" => $hitPlayer->getNickname()]];
        echo json_encode($message);
        foreach ($this->registry->getPlayers() as $player) {
            $this->ws->send($player->getFd(), $message);
        }
    }

    private function processAttackImpact(Player $player, array $payload): void
    {
        $now = microtime(true);
        if (!$player->canShoot($now)) return;
        $player->registerShot($now);

        $shooterState = $player->getPublicState();
        $angle = (float)($payload['angle'] ?? $shooterState["angle"]);

        $randomSpread = ((mt_rand() / mt_getrandmax()) - 0.5) / GameConfig::SPREAD_FACTOR;
        $finalAngle = $angle + $randomSpread;

        $others = $this->registry->getOthersPlayers($player);
        $hitPlayer = $this->hitscan->resolve($player, $finalAngle, $this->map, $others);
        if ($hitPlayer !== null) {
            $hitPlayer?->takeDamage(20, $now);
            $this->killFeed($player, $hitPlayer);
        }


        $this->notifyShot($player, $hitPlayer, $finalAngle);
    }

    private function notifyShot(Player $shooter, ?Player $target, float $angle): void
    {
        $allPlayers = $this->registry->getPlayers();
        $shooterState = $shooter->getPublicState();

        $centerX = $shooterState['x'] + (GameConfig::PLAYER_WIDTH / 2);
        $centerY = $shooterState['y'] + (GameConfig::PLAYER_HEIGHT / 2);

        $startX = $centerX + cos($angle) * GameConfig::DIFF_GUN_FORWARD;
        $startY = $centerY + sin($angle) * GameConfig::DIFF_GUN_FORWARD;
        $startX += cos($angle + M_PI_2) * GameConfig::DIFF_GUN_SIDE;
        $startY += sin($angle + M_PI_2) * GameConfig::DIFF_GUN_SIDE;

        foreach ($allPlayers as $observer) {
            if ($observer === $shooter) continue;

            $obsState = $observer->getPublicState();
            $obsX = $obsState['x'] + (GameConfig::PLAYER_WIDTH / 2);
            $obsY = $obsState['y'] + (GameConfig::PLAYER_HEIGHT / 2);

            $distance = hypot($obsX - $centerX, $obsY - $centerY);
            if ($distance > GameConfig::HEARING_RADIUS) continue;

            $this->ws->send($observer->getFd(), [
                "type" => "shotFired",
                "payload" => [
                    "shooterId" => $shooter->getUserId(),
                    "angle" => $angle,
                    "startX" => $startX,
                    "startY" => $startY,
                ]
            ]);
        }
    }
    private function processReload(Player $player): void
    {

    }
    private function endMatch(): void
    {
        $this->isMatchEnded = true;
        $stats = [];
        foreach ($this->registry->getPlayers() as $player) {
            $stats[] = [
                'nickname' => $player->getNickname(),
                'kills' => $player->getKills(),
                'deaths' => $player->getDeaths()
            ];
        }
        usort($stats, fn($a, $b) => $b['kills'] <=> $a['kills']);
        $packet = [
            'type' => 'game-over',
            'payload' => [
                'stats' => $stats
            ]
        ];
        foreach ($this->registry->getPlayers() as $fd => $player) {
            $this->ws->send($fd, $packet);
        }
    }
}