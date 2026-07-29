<?php

namespace App\Realtime\Domain\Mode;

use App\Realtime\Application\MedkitManager;
use App\Realtime\Domain\Map\GameMap;
use App\Realtime\Domain\Model\Player;

interface GameModeInterface
{
    public function assignTeams(array $players): void;
    public function getSpawnPoint(Player $player, GameMap $map): array;
    public function canDamage(Player $attacker, Player $victim): bool;
    public function handleKill(Player $killer, Player $victim): void;
    public function getGameOverPayload(array $playerStats): array;
    public function isRespawnAllowed(): bool;
    public function isMatchOver(): bool;
    public function checkRoundState(array $players): ?string;
    public function getScores(): array;
    public function onRoundStart(): void;
    public function manageMedkits(MedkitManager $manager, float $now): void;
}