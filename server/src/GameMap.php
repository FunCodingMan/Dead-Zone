<?php

namespace App;

use App\GameConfig;
use App\Rect;
use App\Box;

class GameMap
{
    private array $walls = [];
    private array $boxes = [];
    private array $playerSpawns = [];

    private int $width = 0;
    private int $height = 0;

    public function loadLevel(string $levelString): void
    {
        $this->walls = [];
        $this->boxes = [];
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
            $this->parseCell($line[$col], $col * GameConfig::CELL_SIZE, $row * GameConfig::CELL_SIZE);
        }
    }

    private function parseCell(string $symbol, float $x, float $y): void
    {
        match ($symbol) {
            GameConfig::SYMBOL_WALL => $this->addWall($x, $y),
            GameConfig::SYMBOL_BOX => $this->addBox($x, $y),
            GameConfig::SYMBOL_PLAYER => $this->addPlayerSpawn($x, $y),
            default => null,
        };
    }

    private function addWall(float $x, float $y): void
    {
        $this->walls[] = new Rect($x, $y, GameConfig::CELL_SIZE, GameConfig::CELL_SIZE);
    }
    private function addBox(float $x, float $y): void
    {
        $this->boxes[] = new Box(new Rect($x, $y, GameConfig::CELL_SIZE, GameConfig::CELL_SIZE));
    }

    private function addPlayerSpawn(float $x, float $y): void
    {
        $offsetX = (GameConfig::CELL_SIZE - GameConfig::PLAYER_WIDTH) / 2;
        $offsetY = (GameConfig::CELL_SIZE - GameConfig::PLAYER_HEIGHT) / 2;
        $this->playerSpawns[] = ['x' => $x + $offsetX, 'y' => $y + $offsetY, 'isFree' => true];
    }

    private function collidesWithObstacles(Rect $targetRect): bool
    {
        foreach ($this->walls as $wall) {
            if ($targetRect->intersects($wall)) {
                return true;
            }
        }

        foreach ($this->boxes as $box) {
            if (!$box->isDestroyed() && $targetRect->intersects($box->getRect())) {
                return true;
            }
        }

        return false;
    }

    public function checkCollision(Rect $targetRect): bool
    {
        return $this->collidesWithObstacles($targetRect);
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


}