<?php

namespace App\Realtime\Domain\Combat;

use App\Realtime\Domain\Map\GameConfig;
use App\Realtime\Domain\Map\GameMap;
use App\Realtime\Domain\Map\Rect;
use App\Realtime\Domain\Model\Player;

class HitscanResolver
{
    public static function resolve(Player $shooter, float $angle, GameMap $map, array $otherPlayers): ?Player
    {
        $shooterState = $shooter->getPublicState();

        $centerX = $shooterState['x'] + (GameConfig::PLAYER_WIDTH / 2);
        $centerY = $shooterState['y'] + (GameConfig::PLAYER_HEIGHT / 2);

        $x = $centerX + cos($angle) * GameConfig::DIFF_GUN_FORWARD;
        $y = $centerY + sin($angle) * GameConfig::DIFF_GUN_FORWARD;

        $x += cos($angle + M_PI_2) * GameConfig::DIFF_GUN_SIDE;
        $y += sin($angle + M_PI_2) * GameConfig::DIFF_GUN_SIDE;

        $dx = cos($angle) * GameConfig::RAY_STEP;
        $dy = sin($angle) * GameConfig::RAY_STEP;

        $mapWidth = $map->getWidth();
        $mapHeight = $map->getHeight();

        while ($x >= 0 && $x <= $mapWidth && $y >= 0 && $y <= $mapHeight) {
            $x += $dx;
            $y += $dy;

            if ($map->checkCollision(new Rect($x - 2, $y - 2, 4, 4))) {
                return null;
            }

            $check = new Rect($x - 2, $y - 2, 4, 4);

            foreach ($otherPlayers as $player) {
                if ($player->getHealth() > 0 && $check->intersects($player->getRect())) {
                    return $player;
                }
            }
        }
        return null;
    }
}