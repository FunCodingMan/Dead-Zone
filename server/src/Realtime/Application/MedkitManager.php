<?php


namespace App\Realtime\Application;

use App\Realtime\Domain\Map\GameConfig;
use App\Realtime\Domain\Map\GameMap;
use App\Realtime\Domain\Map\Rect;
use App\Realtime\Domain\Model\Medkit;
use App\Realtime\Domain\Model\Player;
use App\Realtime\Domain\Mode\GameModeInterface;

class MedkitManager
{
    private array $medkits = [];
    private GameMap $map;
    private int $medkitCounter = 0;

    public function __construct(GameMap $map)
    {
        $this->map = $map;
    }
    public function update(float $now, array $players, GameModeInterface $gameMode): void
    {
        $gameMode->manageMedkits($this, $now);

        $this->checkPickups($players);

        $this->medkits = array_filter($this->medkits, fn(Medkit $m) => $m->isActive());
    }

    public function spawn(int $amount = 1): void
    {
        $freeCells = $this->map->getFreeFloorCells();
        if (empty($freeCells)) return;

        for ($i = 0; $i < $amount; $i++) {
            $randomCell = $freeCells[array_rand($freeCells)];

            $x = ($randomCell['col'] * GameConfig::CELL_SIZE) + (GameConfig::CELL_SIZE / 2);
            $y = ($randomCell['row'] * GameConfig::CELL_SIZE) + (GameConfig::CELL_SIZE / 2);

            $this->medkitCounter++;
            $id = "medkit_" . $this->medkitCounter;

            $healAmount = GameConfig::MEDKIT_HEAL;
            $this->medkits[$id] = new Medkit($id, $x, $y, $healAmount);
        }
    }

    private function checkPickups(array $players): void
    {
        foreach ($players as $player) {
            if ($player->isDead() || $player->getHealth() >= GameConfig::MAX_HEALTH_PLAYER) {
                continue;
            }

            $playerRect = $player->getRect();

            foreach ($this->medkits as $medkit) {
                if (!$medkit->isActive()) continue;

                $medkitRect = $medkit->getRect();
                if ($this->checkCollision($playerRect, $medkitRect)) {
                    $player->heal($medkit->getHealAmount());
                    $medkit->pickUp();
                }
            }
        }
    }

    private function checkCollision(Rect $r1, Rect $r2): bool
    {
        return $r1->getX() < $r2->getX() + $r2->getWidth() &&
            $r1->getX() + $r1->getWidth() > $r2->getX() &&
            $r1->getY() < $r2->getY() + $r2->getHeight() &&
            $r1->getY() + $r1->getHeight() > $r2->getY();
    }

    public function getActiveCount(): int
    {
        return count($this->medkits);
    }

    public function clearAll(): void
    {
        $this->medkits = [];
    }

    public function getPublicState(): array
    {
        $state = [];
        foreach ($this->medkits as $medkit) {
            if ($medkit->isActive()) {
                $state[] = $medkit->getPublicState();
            }
        }
        return $state;
    }
}