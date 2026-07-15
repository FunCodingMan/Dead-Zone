<?php

namespace App;

use App\app\model\User;

use App\GameConfig;
use App\Vector2D;
use App\Rect;

class Player
{
    private int $fd;
    private User $user;
    private float $posX;
    private float $posY;
    private float $angle;
    private int $health;
    private int $countBullets;
    private float $speed = GameConfig::PLAYER_SPEED;

    public function __construct(int $fd, User $user = new User("error", "error", "error", "error", "error"))
    {
        $this->fd = $fd;
        $this->user = $user;
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

    public function getUser(): User
    {
        return $this->user;
    }

    public function updateStatePlayer(array $data, GameMap $map): void
    {
        if (isset($data['angle'])) {
            $this->angle = (float)$data['angle'];
        }
        match ($data['type']) {
            "move" => $this->move($data['keys'], $map),
            default => null,
        };
    }

    public function getFullData(): array
    {
        return [
            "user_id" => $this->user->getUserId(),
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

}