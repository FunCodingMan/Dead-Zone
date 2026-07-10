<?php

namespace App\app\model;

class Stats
{
    private int $wins;
    private int $loses;

    public function __construct(?int $wins = null, ?int $losses = null)
    {
        $this->wins = $wins ?? 0;
        $this->loses = $loses ?? 0;
    }

    public function getWins(): int
    {
        return $this->wins;
    }

    public function getLoses(): int
    {
        return $this->loses;
    }
}