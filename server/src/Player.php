<?php

namespace App;

use App\app\model\User;

class Player
{
    private int $fd;
    private User $user;
    private float $posX;
    private float $posY;
    private float $angle;
    private int $health;
    private int $countBullets;
    private float $speed = 8.0;

    public function __construct(int $fd, User $user = new User("error", "error", "error", "error", "error"))
    {
        $this->fd = $fd;
        $this->user = $user;
        $this->posX = 0;
        $this->posY = 0;
        $this->angle = 90;
        $this->countBullets = 50;
        $this->health = 100;
    }

    public function getFd(): int
    {
        return $this->fd;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function updateStatePlayer(array $data): void
    {
        match ($data['type']) {
            "move" => $this->move($data['keys']),
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

    private function move(array $keys): void
    {
        $dx = 0;
        $dy = 0;

        foreach ($keys as $key) {
            if ($key === "w") $dy -= 1;
            if ($key === "s") $dy += 1;
            if ($key === "d") $dx += 1;
            if ($key === "a") $dx -= 1;
        }

        if ($dx === 0 && $dy === 0) return;

        $length = hypot($dx, $dy);

        $this->posX += ($dx / $length) * $this->speed;
        $this->posY += ($dy / $length) * $this->speed;
    }

}