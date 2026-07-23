<?php

namespace App\Realtime\Domain\Model;

use App\Realtime\Domain\Map\GameMap;
use App\Realtime\Domain\Map\Rect;
use App\Realtime\Domain\Map\Vector2D;

class MovementResolver
{
    public static function resolve(Rect $currentRect, array $keys, float $speed, GameMap $map): Vector2D
    {
        $velocity = self::calculateVelocity($keys, $speed);

        $dx = self::tryAxis($currentRect, $velocity->getX(), 0.0, $map);
        $dy = self::tryAxis($currentRect->shift($dx, 0.0), 0.0, $velocity->getY(), $map);

        return new Vector2D($dx, $dy);
    }

    private static function tryAxis(Rect $rect, float $dx, float $dy, GameMap $map): float
    {
        if ($dx === 0.0 && $dy === 0.0) return 0.0;
        $target = $rect->shift($dx, $dy);
        return $map->checkCollision($target) ? 0.0 : ($dx !== 0.0 ? $dx : $dy);
    }

    private static function calculateVelocity(array $keys, float $speed): Vector2D
    {
        $x = 0.0;
        $y = 0.0;
        foreach ($keys as $key) {
            if ($key === 'w') $y -= 1.0;
            if ($key === 's') $y += 1.0;
            if ($key === 'd') $x += 1.0;
            if ($key === 'a') $x -= 1.0;
        }
        return new Vector2D($x, $y)->normalize()->scale($speed);
    }
}