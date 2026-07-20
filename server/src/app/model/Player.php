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
    private float $posX;
    private float $posY;
    private float $angle;
    private int $health;
    private int $countBullets;
    private float $speed = GameConfig::PLAYER_SPEED;
    private float $lastShootTime = 0.0;

    public function __construct(int $fd, string $userId)
    {
        $this->fd = $fd;
        $this->userId = $userId;
        $this->posX = 0.0;
        $this->posY = 0.0;
        $this->angle = 90;
        $this->countBullets = 50;
        $this->health = 100;
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

    public function updateMovePlayer(array $data, GameMap $map): void
    {
        $this->angle = (float)$data['angle'];
        $this->move($data['keys'], $map);
    }

    public function getFullData(): array
    {
        return [
            "user_id" => $this->userId,
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

    public function canShoot($now): bool
    {
        return $this->countBullets > 0 && (($now - $this->lastShootTime) >= GameConfig::SHOOT_COOLDOWN_S);
    }

    public function registerShot(float $now): void
    {
        $this->countBullets--; // нужна проверка на кол-во патронов
        $this->lastShootTime = $now;
    }

    public function takeDamage(int $damage): void
    {
        $this->health -= $damage;
        if ($this->health < 0) $this->health = 0;
    }

    public function getHealth(): int
    {
        return $this->health;
    }

}