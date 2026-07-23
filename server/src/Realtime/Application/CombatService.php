<?php

namespace App\Realtime\Application;

use App\Realtime\Domain\Combat\HitscanResolver;
use App\Realtime\Domain\Map\GameConfig;
use App\Realtime\Domain\Map\GameMap;
use App\Realtime\Domain\Model\Player;
use App\Realtime\Infrastructure\WebSocketTransport;

class CombatService
{
    private WebSocketTransport $ws;
    private PlayerRegistry $registry;
    private GameMap $map;

    public function __construct(WebSocketTransport $ws, PlayerRegistry $registry, GameMap $map)
    {
        $this->ws = $ws;
        $this->registry = $registry;
        $this->map = $map;
    }

    public function handleShot(Player $player, array $payload, float $now): void
    {
        if (!$player->canShoot($now)) return;
        $player->registerShot($now);

        $shooterState = $player->getPublicState();
        $angle = (float)($payload['angle'] ?? $shooterState["angle"]);
        $finalAngle = $angle + $this->randomSpread();

        $others = $this->registry->getOthersPlayers($player);
        $hitPlayer = HitscanResolver::resolve($player, $finalAngle, $this->map, $others);

        if ($hitPlayer !== null) {
            $hitPlayer->takeDamage(20, $now);
            $this->reportKillIfDead($player, $hitPlayer);
        }

        $this->notifyShot($player, $finalAngle);
    }

    private function randomSpread(): float
    {
        return ((mt_rand() / mt_getrandmax()) - 0.5) / GameConfig::SPREAD_FACTOR;
    }

    private function reportKillIfDead(Player $shooter, Player $hitPlayer): void
    {
        if ($hitPlayer->getHealth() > 0) return;

        $shooter->increaseKills();
        $hitPlayer->increaseDeaths();

        $message = [
            "type" => "kill-feed",
            "payload" => ["killer" => $shooter->getNickname(), "victim" => $hitPlayer->getNickname()],
        ];

        foreach ($this->registry->getPlayers() as $player) {
            $this->ws->send($player->getFd(), $message);
        }
    }

    private function notifyShot(Player $shooter, float $angle): void
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
                ],
            ]);
        }
    }
}