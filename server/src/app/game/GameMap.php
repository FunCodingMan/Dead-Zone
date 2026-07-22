<?php

namespace App\app\game;

class GameMap
{
    private array $playerSpawns = [];
    private array $grid = [];
    private array $boxMap = [];
    private int $width = 0;
    private int $height = 0;

    public function loadLevel(string $levelString): void
    {
        $this->playerSpawns = [];

        $lines = explode("\n", trim($levelString));

        $this->height = count($lines) * GameConfig::CELL_SIZE;
        $this->width = strlen($lines[0]) * GameConfig::CELL_SIZE;

        foreach ($lines as $row => $line) {
            $this->parseRow($row, trim($line));
        }


    }

    private function parseRow(int $row, string $line): void
    {
        $length = strlen($line);
        for ($col = 0; $col < $length; $col++) {
            $this->grid[$row][$col] = $line[$col];
            $this->parseCell($line[$col], $col * GameConfig::CELL_SIZE, $row * GameConfig::CELL_SIZE, $row, $col);
        }
    }

    private function parseCell(string $symbol, float $x, float $y, int $row, int $col): void
    {
        match ($symbol) {
            GameConfig::SYMBOL_BOX => $this->addBox($x, $y, $row, $col),
            GameConfig::SYMBOL_PLAYER => $this->addPlayerSpawn($x, $y),
            default => null,
        };
    }

    private function addBox(float $x, float $y,  int $row, int $col): void
    {
        $box = new Box(new Rect($x, $y, GameConfig::CELL_SIZE, GameConfig::CELL_SIZE));

        $this->boxMap["{$row}_{$col}"] = $box;
    }

    private function addPlayerSpawn(float $x, float $y): void
    {
        $offsetX = (GameConfig::CELL_SIZE - GameConfig::PLAYER_WIDTH) / 2;
        $offsetY = (GameConfig::CELL_SIZE - GameConfig::PLAYER_HEIGHT) / 2;
        $this->playerSpawns[] = ['x' => $x + $offsetX, 'y' => $y + $offsetY, 'isFree' => true];
    }

    public function isSolidPoint(float $x, float $y): bool
    {
        $col = (int)floor($x / GameConfig::CELL_SIZE);
        $row = (int)floor($y / GameConfig::CELL_SIZE);

        if (!isset($this->grid[$row][$col])) {
            return true;
        }

        $symbol = $this->grid[$row][$col];

        if ($symbol === GameConfig::SYMBOL_WALL) {
            return true;
        }

        if ($symbol === GameConfig::SYMBOL_BOX) {
            $key = "{$row}_{$col}";
            if (isset($this->boxMap[$key]) && !$this->boxMap[$key]->isDestroyed()) {
                return true;
            }
        }

        return false;
    }

    public function checkCollision(Rect $targetRect): bool
    {
        $startCol = (int)floor($targetRect->getX() / GameConfig::CELL_SIZE);
        $endCol = (int)floor(($targetRect->getX() + $targetRect->getWidth()) / GameConfig::CELL_SIZE);
        $startRow = (int)floor($targetRect->getY() / GameConfig::CELL_SIZE);
        $endRow = (int)floor(($targetRect->getY() + $targetRect->getHeight()) / GameConfig::CELL_SIZE);

        for ($row = $startRow; $row <= $endRow; $row++) {
            for ($col = $startCol; $col <= $endCol; $col++) {
                $cellCenterX = ($col * GameConfig::CELL_SIZE) + (GameConfig::CELL_SIZE / 2);
                $cellCenterY = ($row * GameConfig::CELL_SIZE) + (GameConfig::CELL_SIZE / 2);

                if ($this->isSolidPoint($cellCenterX, $cellCenterY)) {
                    return true;
                }
            }
        }

        return false;
    }

    public function findFreeSpawn(string $symbol): array
    {
        $spawns = &$this->playerSpawns;

        if (empty($spawns)) {
            return ['x' => 100, 'y' => 100];
        }

        $freePlaces = array_filter($spawns, fn($spawn) => $spawn['isFree'] === true);

        if (empty($freePlaces)) {
            foreach ($spawns as &$spawn) {
                $spawn['isFree'] = true;
            }
            $freePlaces = $spawns;
        }

        $randomKey = array_rand($freePlaces);

        $spawns[$randomKey]['isFree'] = false;

        return [
            'x' => $spawns[$randomKey]['x'],
            'y' => $spawns[$randomKey]['y'],
        ];

    }

    public function getWidth(): int
    {
        return $this->width;
    }

    public function getHeight(): int
    {
        return $this->height;
    }


}