<?php

namespace App\app\game;

use App\app\model\Player;
use App\HitscanResolver;
use App\PlayerRegistry;
use App\MessageQueue;
use App\VisibilityService;
use App\WebSocketTransport;

class GameEngine
{
    private WebSocketTransport $ws;
    private PlayerRegistry $registry;
    private GameMap $map;
    private MessageQueue $queue;
    private HitscanResolver $hitscan;
    private VisibilityService $visibility;
    public function __construct(WebSocketTransport $ws, PlayerRegistry $registry, MessageQueue $queue, GameMap $map)
    {
        $this->ws = $ws;
        $this->registry = $registry;
        $this->map = $map;
        $this->queue = $queue;

        $this->hitscan = new HitscanResolver();
        $this->visibility = new VisibilityService($map);
    }

    public function pushData(): void
    {
        $arrData = $this->queue->dequeueAll();
        if (!empty($arrData)) {
            foreach ($arrData as $data) {
                $player = $this->registry->getPlayerByFd($data["fd"]);
                if ($player === null) continue;

                match ($data["type"]) {
                    'move' => $player->setInput($data["payload"]["keys"], (float)$data["payload"]["angle"]),
                    'shot' => $this->processAttackImpact($player, $data["payload"]),
                    default => null
                };

            }
        }
        $players = $this->registry->getPlayers();

        foreach ($players as $player) {
            $player->applyMovement($this->map);
        }

        foreach ($players as $player) {
            $others = $this->visibility->getVisiblePlayers($player, $players);
            $this->registry->sendVisiblePlayers($player, $others);
        }
        $visiblePlayers = $this->registry->getVisiblePlayers();
        $this->ws->broadcastGameState($visiblePlayers);
    }


    public function spawnPlayers(): void
    {
        $players = $this->registry->getPlayers();
        foreach ($players as $player) {
            $spawn = $this->map->findFreeSpawn(GameConfig::SYMBOL_PLAYER);
            $player->setPos($spawn['x'], $spawn['y']);
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
        $hitPlayer = HitscanResolver::resolve($player, $finalAngle, $this->map, $others);
        $hitPlayer?->takeDamage(20);

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
}