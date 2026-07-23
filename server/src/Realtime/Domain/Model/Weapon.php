<?php

namespace App\Realtime\Domain\Model;

use App\Realtime\Domain\Map\GameConfig;

class Weapon
{
    private int $maxCountBullets;
    private float $lastShootTime;
    private float $reloadTime;
    private int $countBullets;
    private float $shootCooldown;
    private float $reloadEndTime;
    private int $burstCount;

    public function __construct()
    {
        $this->maxCountBullets = GameConfig::MAX_BULLETS;
        $this->shootCooldown = GameConfig::SHOOT_COOLDOWN_S;
        $this->reloadTime = GameConfig::RELOAD_TIME_S;
        $this->countBullets = $this->maxCountBullets;
        $this->lastShootTime = 0.0;
        $this->reloadEndTime = 0.0;
        $this->burstCount = 0;
    }

    public function canShoot($now): bool
    {
        $this->processReload($now);
        if ($this->reloadEndTime > 0.0) {
            return false;
        }
        return $this->countBullets > 0 && (($now - $this->lastShootTime) >= $this->shootCooldown - 0.05);
    }

    public function registerShot(float $now): void
    {
        if ($this->isFirstShot($now)) {
            $this->burstCount = 1;
        } else {
            $this->burstCount++;
        }

        $this->countBullets--;
        $this->lastShootTime = $now;
    }

    public function startReload(float $now): void
    {
        if ($this->countBullets === $this->maxCountBullets) return;
        if ($this->reloadEndTime > 0.0) return;
        $this->reloadEndTime = $now + $this->reloadTime;
    }

    public function getCountBullets(float $now): int
    {
        $this->processReload($now);
        return $this->countBullets;
    }

    public function reset(): void
    {
        $this->countBullets = $this->maxCountBullets;
        $this->reloadEndTime = 0.0;
    }

    private function processReload(float $now): void
    {
        if ($this->reloadEndTime > 0.0 && $now >= $this->reloadEndTime)
        {
            $this->countBullets = $this->maxCountBullets;
            $this->reloadEndTime = 0.0;
        }
    }
    public function isFirstShot(float $now): bool
    {
        return ($now - $this->lastShootTime) > ($this->shootCooldown * 1.5);
    }
    public function getBurstCount(): int
    {
        return $this->burstCount;
    }
}