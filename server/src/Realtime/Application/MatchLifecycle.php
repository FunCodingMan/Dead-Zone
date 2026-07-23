<?php

namespace App\Realtime\Application;

use App\Realtime\Domain\Map\GameConfig;

class MatchLifecycle
{
    private float $startTime;
    private bool $isEnded;

    public function __construct()
    {
        $this->startTime = 0.0;
        $this->isEnded = false;
    }

    public function start(float $now): void
    {
        $this->startTime = $now;
        $this->isEnded = false;
    }

    public function getTimeLeft(float $now): float
    {
        return max(0.0, GameConfig::MATCH_DURATION_S - ($now - $this->startTime));
    }

    public function isOver(float $now): bool
    {
        if ($this->isEnded) return true;
        return $this->getTimeLeft($now) <= 0.0;
    }

        public function markEnded(): void
    {
        $this->isEnded = true;
    }
}