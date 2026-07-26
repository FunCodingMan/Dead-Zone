<?php

namespace App\Realtime\Application;

use App\Realtime\Domain\Map\GameConfig;

class MatchLifecycle
{
    private float $startTime;
    private bool $isEnded;
    private float $duration;

    public function __construct(float $duration = 0.0)
    {
        $this->startTime = 0.0;
        $this->isEnded = false;
        $this->duration = $duration;
    }

    public function start(float $now): void
    {
        $this->startTime = $now;
        $this->isEnded = false;
    }

    public function getTimeLeft(float $now): float
    {
        return max(0.0, $this->duration - ($now - $this->startTime));
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
    public function setDuration(float $duration): void
    {
        $this->duration = $duration;
    }
}