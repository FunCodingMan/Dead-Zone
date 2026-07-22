<?php

namespace App;

use App\app\game\GameConfig;
use App\app\game\GameMap;
use App\app\game\Rect;
use App\app\model\Player;

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

            if ($map->isSolidPoint($x, $y)) {
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