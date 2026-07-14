<?php

namespace App;

class Player
{
    private int $fd;
    private int $posX;
    private int $posY;

    public function __construct(int $fd)
    {
        $this->fd = $fd;
        $this->posX = 0;
        $this->posY = 0;
    }

    public function getFd(): int
    {
        return $this->fd;
    }

    public function updateStatePlayer(array $data): void
    {
        match ($data['type']) {
            "move" => $this->move($data['keys']),
            default => null,
        };
    }

    public function getArrayPlayer(): array
    {
        return ["x" => $this->posX, "y" => $this->posY];
    }

    private function move(array $keys): void
    {
        foreach ($keys as $key) {
            if ($key === "w") {
                $this->posY++;
            }
            if ($key === "s") {
                $this->posY--;
            }
            if ($key === "d") {
                $this->posX++;
            }
            if ($key === "a") {
                $this->posX--;
            }
        }
    }

}