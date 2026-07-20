<?php

namespace App;

use App\app\model\Player;
use App\app\game\GameConfig;
use App\app\game\GameMap;
use App\app\game\Rect;

class VisibilityService
{
    private GameMap $map;
    public function __construct(GameMap $map)
    {
        $this->map = $map;
    }

    public function getVisiblePlayers(Player $observer, array $allPlayers): array
    {
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
            $playerState = $player->getPublicState();

            $targetX = $playerState['x'] + (GameConfig::PLAYER_WIDTH / 2);
            $targetY = $playerState['y'] + (GameConfig::PLAYER_HEIGHT / 2);

            $distance = hypot($targetX - $obsX, $targetY - $obsY);

            if ($distance > GameConfig::VISIBILITY_RADIUS) {
                continue;
            }

            if (!$this->isInFOV($obsX, $obsY, $obsAngle, $targetX, $targetY)) {
                continue;
            }

            if ($this->hasObstacleInSight($obsX, $obsY, $targetX, $targetY, $distance)) {
                $visiblePlayers[] = $player;
            }
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

            $checkRect = new Rect($currentX - 2, $currentY - 2, 4, 4);

            if ($this->map->checkCollision($checkRect)) {
                return false;
            }
        }
        return true;
    }

}