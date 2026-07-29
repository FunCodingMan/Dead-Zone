<?php


namespace App\Realtime\Domain\Model;

use App\Realtime\Domain\Map\GameConfig;
use App\Realtime\Domain\Map\Rect;

class Medkit
{
    private string $id;
    private float $posX;
    private float $posY;
    private int $healAmount;
    private bool $isActive;

    public function __construct(string $id, float $x, float $y, int $healAmount = 50)
    {
        $this->id = $id;
        $this->posX = $x;
        $this->posY = $y;
        $this->healAmount = $healAmount;
        $this->isActive = true;
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getHealAmount(): int
    {
        return $this->healAmount;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function pickUp(): void
    {
        $this->isActive = false;
    }

    public function getRect(): Rect
    {
        $size = GameConfig::MEDKIT_SIZE ?? 20;
        return new Rect($this->posX, $this->posY, $size, $size);
    }

    public function getPublicState(): array
    {
        return [
            "id" => $this->id,
            "x" => $this->posX,
            "y" => $this->posY,
        ];
    }
}