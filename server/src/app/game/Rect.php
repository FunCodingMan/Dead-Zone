<?php

namespace App\app\game;

class Rect {
    private float $x;
    private float $y;
    private float $w;
    private float $h;

    public function __construct(float $x, float $y, float $w, float $h) {
        $this->x = $x;
        $this->y = $y;
        $this->w = $w;
        $this->h = $h;
    }

    public function intersects(Rect $other): bool {
        return $this->x < $other->x + $other->w &&
               $this->x + $this->w > $other->x  &&
               $this->y < $other->y + $other->h &&
               $this->y + $this->h > $other->y;
    }

    public function shift(float $dx, float $dy): self {
        return new self($this->x + $dx, $this->y + $dy, $this->w, $this->h);
    }

    public function getX(): float
    {
        return $this->x;
    }

    public function getY(): float
    {
        return $this->y;
    }

    public function getWidth(): float
    {
        return $this->w;
    }

    public function getHeight(): float
    {
        return $this->h;
    }

    public function setX(float $x): void
    {
        $this->x = $x;
    }

    public function setY(float $y): void
    {
        $this->y = $y;
    }

    public function setWidth(float $w): void
    {
        $this->w = $w;
    }

    public function setHeight(float $h): void
    {
        $this->h = $h;
    }

}