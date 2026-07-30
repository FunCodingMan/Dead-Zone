<?php

namespace App\Site\app\model;

class Stats
{
    private int $deathmatchWins;
    private int $teamDeathmatchWins;
    private int $eliminationWins;
    private int $deathmatchLose;
    private int $teamDeathmatchLose;
    private int $eliminationLose;
    private int $kills;
    private int $deaths;
    private int $kd;

    public function __construct(?int $kills = null, ?int $deaths = null, ?int $kd = null, ?int $deathmatchWins = null, ?int $teamDeathmatchWins = null, ?int $eliminationWins = null, ?int $deathmatchLose = null, ?int $teamDeathmatchLose = null, ?int $eliminationLose = null,)
    {
        $this->kills = $kills ?? 0;
        $this->deaths = $deaths ?? 0;
        $this->kd = $kd ?? 0;
        $this->deathmatchWins = $deathmatchWins ?? 0;
        $this->teamDeathmatchWins = $teamDeathmatchWins ?? 0;
        $this->eliminationWins = $eliminationWins ?? 0;
        $this->deathmatchLose = $deathmatchLose ?? 0;
        $this->teamDeathmatchLose = $teamDeathmatchLose ?? 0;
        $this->eliminationLose = $eliminationLose ?? 0;
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

    public function getDeathMatchWins(): int
    {
        return $this->deathmatchWins;
    }

    public function getTeamDeathmatchWins(): int
    {
        return $this->teamDeathmatchWins;
    }

    public function getEliminationWins(): int
    {
        return $this->eliminationWins;
    }

    public function getDeathMatchLose(): int
    {
        return $this->deathmatchLose;
    }

    public function getTeamDeathmatchLose(): int
    {
        return $this->teamDeathmatchLose;
    }

    public function getEliminationLose(): int
    {
        return $this->eliminationLose;
    }
}