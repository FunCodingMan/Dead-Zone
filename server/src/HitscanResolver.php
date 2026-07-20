<?php

namespace App;

use App\app\game\GameConfig;
use App\app\game\GameMap;
use App\app\game\Rect;
use App\app\model\Player;

class HitscanResolver
{
    public static function resolve(Player $shooter, GameMap $map, array $otherPlayers): ?Player
    {
        $shooterState = $shooter->getPublicState();
        $x = $shooterState['x'] + (GameConfig::PLAYER_WIDTH / 2);
        $y = $shooterState['x'] + (GameConfig::PLAYER_HEIGHT / 2);
        $angle = $shooterState['angle'];

        $dx = cos($angle) * GameConfig::RAY_STEP;
        $dy = cos($angle) * GameConfig::RAY_STEP;

        $mapWidth = $map->getWidth();
        $mapHeight = $map->getHeight();

        while ($x >= 0 && $x <= $mapWidth && $y >= 0 && $y <= $mapHeight) {
            $x += $dx;
            $y += $dy;

            $check = new Rect($x - 2, $y - 2, 4, 4);

            if ($map->checkCollision($check)) {
                return null;
            }

            foreach ($otherPlayers as $player) {
                if ($player->getHealth() > 0 && $check->intersects($player->getRect())) {
                    return $player;
                }
            }
        }
        return null;
    }
}