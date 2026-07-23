<?php

namespace App\Realtime\Domain\Model;

use App\Realtime\Domain\Map\GameConfig;

class Health
{
    private int $health;
    private float $deathTime;
    private int $maxHealth;

    public function __construct()
    {
        $this->maxHealth = GameConfig::MAX_HEALTH_PLAYER;
        $this->health = $this->maxHealth;
        $this->deathTime = 0.0;
    }

    public function takeDamage(int $damage, float $now): void
    {
        if ($this->health <= 0) return;

        $this->health -= $damage;
        if ($this->health <= 0) {
            $this->health = 0;
            $this->deathTime = $now;
        }
    }

    public function reset(): void
    {
        $this->health = $this->maxHealth;
        $this->deathTime = 0.0;
    }

    public function isDead(): bool { return $this->health <= 0; }
    public function getDeathTime(): float { return $this->deathTime; }
    public function getValue(): int { return $this->health; }

}