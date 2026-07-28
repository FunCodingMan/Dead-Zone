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
        $winner = GameConfig::WINNER_DRAW;

        if (count($playerStats) === 1) {
            $winner = $playerStats[0]['nickname'];
        } elseif (count($playerStats) > 1) {
            $p1 = $playerStats[0];
            $p2 = $playerStats[1];

            if ($p1['kills'] !== $p2['kills'] || $p1['deaths'] !== $p2['deaths']) {
                $winner = $p1['nickname'];
            }
        }

        return [
            'mode' => GameConfig::MODE_DEATHMATCH,
            'winner' => $winner,
            'stats' => $playerStats
        ];
    }
}