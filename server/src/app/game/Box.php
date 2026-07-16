<?php

namespace App\app\game;

use App\app;

class Box {
    private int $health = 100;
    private bool $isDestroyed = false;

    private Rect $rect;

    public function __construct(Rect $rect) {
        $this->rect = $rect;
    }

    public function takeDamage(int $damage): void {
        if ($this->isDestroyed) return;

        $this->health -= $damage;
        if ($this->health <= 0) {
            $this->isDestroyed = true;
        }
    }

    public function isDestroyed(): bool {
        return $this->isDestroyed;
    }

    public function getRect(): app\game\Rect
    {
        return $this->rect;
    }
}
