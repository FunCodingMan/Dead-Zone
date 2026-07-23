<?php

namespace App\Realtime\Domain\Combat;

use App\Realtime\Domain\Map\GameConfig;
use App\Realtime\Domain\Map\GameMap;
use App\Realtime\Domain\Map\Rect;
use App\Realtime\Domain\Model\Player;

class VisibilityService
{
    private GameMap $map;
    private bool $isFogOfWarEnabled = GameConfig::IS_FOG_ACTIVE;
    public function __construct(GameMap $map)
    {
        $this->map = $map;
    }
    public function setFogOfWar(bool $enabled): void
    {
        $this->isFogOfWarEnabled = $enabled;
    }

    public function getVisiblePlayers(Player $observer, array $allPlayers): array
    {
        if ($observer->isDead()) {
            return [];
        }

        $visiblePlayers = [];
        $observerState = $observer->getPublicState();
        $obsX = $observerState['x'] + (GameConfig::PLAYER_WIDTH / 2);
        $obsY = $observerState['y'] + (GameConfig::PLAYER_HEIGHT / 2);
        $obsAngle = $observerState["angle"];

        foreach ($allPlayers as $player) {
            if ($player === $observer) {
                continue;
            }
            if ($player->getHealth() <= 0) {
                continue;
            }
            if (!$this->isFogOfWarEnabled) {
                $visiblePlayers[] = $player;
                continue;
            }
            $playerState = $player->getPublicState();

            $targetX = $playerState['x'] + (GameConfig::PLAYER_WIDTH / 2);
            $targetY = $playerState['y'] + (GameConfig::PLAYER_HEIGHT / 2);

            $distance = hypot($targetX - $obsX, $targetY - $obsY);

            if ($distance > GameConfig::VISIBILITY_RADIUS) {
                continue;
            }

            $inFov = $this->isInFOV($obsX, $obsY, $obsAngle, $targetX, $targetY);
            $inCloseRange = $distance <= GameConfig::RADIUS_OF_CLOSE_OBSERVE;

            if (!$inFov && !$inCloseRange) {
                continue;
            }

            if ($this->hasObstacleInSight($obsX, $obsY, $targetX, $targetY, $distance)) {
                continue;
            }

            $visiblePlayers[] = $player;
        }
        return $visiblePlayers;
    }

    private function isInFOV(float $obsX, float $obsY, float $obsAngle, float $targetX, float $targetY): bool
    {
        $angleToTarget = atan2($targetY - $obsY, $targetX - $obsX);

        $angleDiff = $angleToTarget - $obsAngle;

        while ($angleDiff > M_PI) $angleDiff -= 2 * M_PI;
        while ($angleDiff < -M_PI) $angleDiff += 2 * M_PI;

        return abs($angleDiff) <= GameConfig::FOV_ANGLE;
    }

    private function hasObstacleInSight(float $startX, float $startY, float $targetX, float $targetY, float $distance): bool
    {
        $dx = ($targetX - $startX) / $distance;
        $dy = ($targetY - $startY) / $distance;

        $currentX = $startX;
        $currentY = $startY;

        $steps = floor($distance / GameConfig::RAY_STEP);

        for ($step = 0; $step < $steps; $step++) {
            $currentX += $dx * GameConfig::RAY_STEP;
            $currentY += $dy * GameConfig::RAY_STEP;

            if ($this->map->checkCollision(new Rect($currentX - 2, $currentY - 2, 4, 4))) {
                return true;
            }
        }
        return false;
    }

}