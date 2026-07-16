<?php

namespace App\app\game;

class Vector2D {
    private float $x = 0.0;
    private float $y = 0.0;
    public function __construct(float $x, float $y) {
        $this->x = $x;
        $this->y = $y;
    }

    public function isZero(): bool {
        return $this->x === 0.0 && $this->y === 0.0;
    }

    public function normalize(): self {
        if ($this->isZero()) {
            return $this;
        }

        $length = hypot($this->x, $this->y);

        return new self($this->x / $length, $this->y / $length);
    }

    public function scale(float $speed): self {
        return new self($this->x * $speed, $this->y * $speed);
    }

    public function getX(): float
    {
        return $this->x;
    }

    public function getY(): float
    {
        return $this->y;
    }


}