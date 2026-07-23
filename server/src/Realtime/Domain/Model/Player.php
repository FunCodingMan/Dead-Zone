<?php

namespace App\Realtime\Domain\Model;

use App\Realtime\Domain\Map\GameConfig;
use App\Realtime\Domain\Map\GameMap;
use App\Realtime\Domain\Map\Rect;

class Player
{
    private Health $health;
    private Weapon $weapon;
    private int $fd;
    private string $userId;
    private string $nickname;
    private float $posX;
    private float $posY;
    private float $angle;
    private float $speed;
    private array $pressKeys;
    private int $kills;
    private int $deaths;

    public function __construct(int $fd, string $userId, string $nickname = "Player")
    {
        $this->health = new Health();
        $this->weapon = new Weapon();
        $this->fd = $fd;
        $this->userId = $userId;
        $this->nickname = $nickname;
        $this->posX = 0.0;
        $this->posY = 0.0;
        $this->angle = 90;
        $this->pressKeys = [];
        $this->speed = GameConfig::PLAYER_SPEED;
        $this->kills = 0;
        $this->deaths = 0;
    }

    public function getFd(): int { return $this->fd; }
    public function getUserId(): string { return $this->userId; }
    public function getNickname(): string { return $this->nickname; }
    public function addKill(): void { $this->kills++; }
    public function addDeath(): void { $this->deaths++; }
    public function getKills(): int { return $this->kills; }
    public function getDeaths(): int { return $this->deaths; }
    public function increaseKills(): void { $this->kills++; }
    public function increaseDeaths(): void { $this->deaths++; }


    public function getRect(): Rect
    {
        $offsetX = (GameConfig::PLAYER_WIDTH - GameConfig::HITBOX_SIZE) / 2;
        $offsetY = (GameConfig::PLAYER_HEIGHT - GameConfig::HITBOX_SIZE) / 2;
        return new Rect($this->posX + $offsetX, $this->posY + $offsetY, GameConfig::HITBOX_SIZE, GameConfig::HITBOX_SIZE);
    }

    public function setInput(array $keys, float $angle): void
    {
        $this->pressKeys = $keys;
        $this->angle = $angle;
    }

    public function applyMovement(GameMap $map): void
    {
        if ($this->isDead() || empty($this->pressKeys)) return;

        $delta = MovementResolver::resolve($this->getRect(), $this->pressKeys, $this->speed, $map);
        $this->posX += $delta->getX();
        $this->posY += $delta->getY();
    }

    public function getFullData(): array
    {
        return [
            "user_id" => $this->userId,
            "nickname" => $this->nickname,
            "x" => $this->posX,
            "y" => $this->posY,
            "angle" => $this->angle,
            "health" => $this->health->getValue(),
            "count_bullets" => $this->weapon->getCountBullets(microtime(true)),
        ];
    }

    public function getPublicState(): array
    {
        return [
            "x" => $this->posX,
            "y" => $this->posY,
            "angle" => $this->angle,
            "nickname" => $this->nickname,
        ];
    }

    public function getArrayPlayer(): array
    {
        return ["x" => $this->posX, "y" => $this->posY];
    }

    public function setPos(float $x, float $y): void
    {
        $this->posX = $x;
        $this->posY = $y;
    }

    public function respawn(float $x, float $y): void
    {
        $this->health->reset();
        $this->weapon->reset();
        $this->posX = $x;
        $this->posY = $y;
    }

    public function isDead(): bool { return $this->health->isDead(); }
    public function getDeathTime(): float { return $this->health->getDeathTime(); }
    public function takeDamage(int $damage, float $now): void { $this->health->takeDamage($damage, $now); }
    public function getHealth(): int { return $this->health->getValue(); }

    public function canShoot(float $now): bool { return $this->weapon->canShoot($now); }
    public function registerShot(float $now): void { $this->weapon->registerShot($now); }
    public function startReload(float $now): void { $this->weapon->startReload($now); }

}