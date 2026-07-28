<?php

namespace App\Realtime\Domain\Mode;

use App\Realtime\Domain\Map\GameConfig;
use App\Realtime\Domain\Map\GameMap;
use App\Realtime\Domain\Model\Player;

class DeathMatchMode implements GameModeInterface
{
    public function assignTeams(array $players): void
    {
        foreach ($players as $player) {
            $player->setTeam(GameConfig::TEAM_NONE);
        }
    }

    public function getSpawnPoint(Player $player, GameMap $map): array
    {
        return $map->findFreeSpawn(GameConfig::SYMBOL_PLAYER);
    }

    public function canDamage(Player $attacker, Player $victim): bool
    {
        return true;
    }

    public function handleKill(Player $killer, Player $victim): void
    {
        $killer->increaseKills();
        $victim->increaseDeaths();
    }

    public function isRespawnAllowed(): bool
    {
        return true;
    }

    public function checkRoundState(array $players): ?string
    {
        return null;
    }

    public function isMatchOver(): bool
    {
        return false;
    }

    public function getScores(): array
    {
        return [];
    }

    public function getGameOverPayload(array $playerStats): array
    {
        return [
            'mode' => GameConfig::MODE_DEATHMATCH,
            'winner' => $playerStats[0]['nickname'] ?? null,
            'stats' => $playerStats
        ];
    }
}