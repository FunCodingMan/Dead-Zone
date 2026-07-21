<?php

namespace App\app\model;

use App\app\game\GameConfig;
use App\app\game\GameMap;
use App\app\game\Rect;
use App\app\game\Vector2D;

class Player
{
    private int $fd;
    private string $userId;
    private string $nickname;
    private float $posX;
    private float $posY;
    private float $angle;
    private int $health;
    private int $countBullets;
    private float $speed;
    private float $lastShootTime;
    private float $reloadEndTime = 0.0;
    private float $deathTime = 0.0;
    private array $pressKeys;
    private int $kills;
    private int $deaths;

    public function __construct(int $fd, string $userId, string $nickname = "Player")
    {
        $this->fd = $fd;
        $this->userId = $userId;
        $this->nickname = $nickname;
        $this->posX = 0.0;
        $this->posY = 0.0;
        $this->angle = 90;
        $this->countBullets = GameConfig::MAX_BULLETS;
        $this->health = GameConfig::HP_SIZE;
        $this->pressKeys = [];
        $this->speed = GameConfig::PLAYER_SPEED;
        $this->lastShootTime = 0.0;
        $this->kills = 0;
        $this->deaths = 0;
    }

    public function getRect(): Rect
    {
        $offsetX = (GameConfig::PLAYER_WIDTH - GameConfig::HITBOX_SIZE) / 2;
        $offsetY = (GameConfig::PLAYER_HEIGHT - GameConfig::HITBOX_SIZE) / 2;
        return new Rect($this->posX + $offsetX, $this->posY + $offsetY, GameConfig::HITBOX_SIZE, GameConfig::HITBOX_SIZE);
    }

    public function getFd(): int
    {
        return $this->fd;
    }

    public function getUserId(): string
    {
        return $this->userId;
    }

    public function setInput(array $keys, float $angle): void
    {
        $this->pressKeys = $keys;
        $this->angle = $angle;
    }

    public function applyMovement(GameMap $map): void
    {
        if (empty($this->pressKeys)) return;
        $this->move($this->pressKeys, $map);
    }

    public function getFullData(): array
    {
        $this->processReload(microtime(true));

        return [
            "user_id" => $this->userId,
            "nickname" => $this->nickname,
            "x" => $this->posX,
            "y" => $this->posY,
            "angle" => $this->angle,
            "health" => $this->health,
            "count_bullets" => $this->countBullets,
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

    private function calculateVelocity(array $keys): Vector2D
    {
        $x = 0.0;
        $y = 0.0;

        foreach ($keys as $key) {
            if ($key === 'w') $y -= 1.0;
            if ($key === 's') $y += 1.0;
            if ($key === 'd') $x += 1.0;
            if ($key === 'a') $x -= 1.0;
        }

        return (new Vector2D($x, $y))->normalize()->scale($this->speed);
    }

    private function tryMove(float $dx, float $dy, GameMap $map): void
    {
        if ($dx === 0.0 && $dy === 0.0) return;

        $targetRect = $this->getRect()->shift($dx, $dy);

        if (!$map->checkCollision($targetRect)) {
            $this->posX += $dx;
            $this->posY += $dy;
        }
    }

    private function move(array $keys, GameMap $map): void
    {
        $velocity = $this->calculateVelocity($keys);

        $this->tryMove($velocity->getX(), 0.0, $map);
        $this->tryMove(0.0, $velocity->getY(), $map);
    }

    public function setPos(float $x, float $y): void
    {
        $this->posX = $x;
        $this->posY = $y;
    }
    public function startReload(float $now): void
    {
        if ($this->countBullets === GameConfig::MAX_BULLETS) return;

        if ($this->reloadEndTime > 0.0) return;

        $this->reloadEndTime = $now + GameConfig::RELOAD_TIME_S;
    }
    private function processReload(float $now): void
    {
        if ($this->reloadEndTime > 0.0 && $now >= $this->reloadEndTime)
        {
            $this->countBullets = GameConfig::MAX_BULLETS;
            $this->reloadEndTime = 0.0;
        }
    }

    public function canShoot($now): bool
    {
        $this->processReload($now);
        if ($this->reloadEndTime > 0.0) {
            return false;
        }
        return $this->countBullets > 0 && (($now - $this->lastShootTime) >= GameConfig::SHOOT_COOLDOWN_S);
    }

    public function registerShot(float $now): void
    {
        $this->countBullets--; // нужна проверка на кол-во патронов
        $this->lastShootTime = $now;
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

    public function isDead(): bool
    {
        return $this->health <= 0;
    }
    public function getDeathTime(): float
    {
        return $this->deathTime;
    }

    public function respawn(float $x, float $y): void
    {
        $this->health = GameConfig::HP_SIZE;
        $this->countBullets = GameConfig::MAX_BULLETS;
        $this->posX = $x;
        $this->posY = $y;
        $this->deathTime = 0.0;
        $this->reloadEndTime = 0.0;
    }

    public function getHealth(): int
    {
        return $this->health;
    }

    public function addKill(): void
    {
        $this->kills++;
    }

    public function addDeath(): void
    {
        $this->deaths++;
    }

    public function getKills(): int
    {
        return $this->kills;
    }

    public function getDeaths(): int
    {
        return $this->deaths;
    }
    public function getNickname(): string
    {
        return $this->nickname;
    }

}