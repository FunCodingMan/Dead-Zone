<?php

namespace App\Site\app\model;

class Stats
{
    private int $wins;
    private int $loses;
    private int $kills;
    private int $deaths;
    private int $kd;

    public function __construct(?int $wins = null, ?int $loses = null, ?int $kills = null, ?int $deaths = null, ?int $kd = null)
    {
        $this->wins = $wins ?? 0;
        $this->loses = $loses ?? 0;
        $this->kills = $kills ?? 0;
        $this->deaths = $deaths ?? 0;
        $this->kd = $kd ?? 0;
    }

    public function getWins(): int
    {
        return $this->wins;
    }

    public function getLoses(): int
    {
        return $this->loses;
    }

    public function getKills(): int
    {
        return $this->kills;
    }

    public function getDeaths(): int
    {
        return $this->deaths;
    }

    public function getKd(): int
    {
        return $this->kd;
    }
}