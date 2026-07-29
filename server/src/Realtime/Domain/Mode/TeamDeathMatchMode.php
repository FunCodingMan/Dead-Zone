<?php

namespace App\Realtime\Domain\Mode;

use App\Realtime\Application\MedkitManager;
use App\Realtime\Domain\Map\GameConfig;
use App\Realtime\Domain\Map\GameMap;
use App\Realtime\Domain\Model\Player;

class TeamDeathMatchMode implements GameModeInterface
{
    private int $redScore = 0;
    private int $blueScore = 0;
    private float $lastMedkitSpawn = 0.0;

    public function onRoundStart(): void
    {
        $this->lastMedkitSpawn = microtime(true);
    }

    public function manageMedkits(MedkitManager $manager, float $now): void
    {
        if ($manager->getActiveCount() < GameConfig::DEATHMATCH_MAX_MEDKITS) {
            if (($now - $this->lastMedkitSpawn) >= GameConfig::DEATHMATCH_MAX_MEDKITS) {
                $manager->spawn(1);
                $this->lastMedkitSpawn = $now;
            }
        }
    }

    public function assignTeams(array $players): void
    {
        $isRed = true;

        foreach ($players as $player) {
            if ($player->getTeam() !== GameConfig::TEAM_NONE) {
                continue;
            }
            $player->setTeam($isRed ? GameConfig::TEAM_RED : GameConfig::TEAM_BLUE);
            $isRed = !$isRed;
        }
    }

    public function getSpawnPoint(Player $player, GameMap $map): array
    {
        return $map->findFreeSpawn(GameConfig::SYMBOL_PLAYER);
    }

    public function canDamage(Player $attacker, Player $victim): bool
    {
        return $attacker->getTeam() !== $victim->getTeam();
    }

    public function handleKill(Player $killer, Player $victim): void
    {
        $killer->increaseKills();
        $victim->increaseDeaths();

        if ($killer->getTeam() === GameConfig::TEAM_RED) {
            $this->redScore++;
        } else if ($killer->getTeam() === GameConfig::TEAM_BLUE) {
            $this->blueScore++;
        }
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
        $winnerTeam = GameConfig::TEAM_NONE;
        if ($this->redScore > $this->blueScore) $winnerTeam = GameConfig::TEAM_RED;
        if ($this->blueScore > $this->redScore) $winnerTeam = GameConfig::TEAM_BLUE;

        return [
            'mode' => GameConfig::MODE_TEAM_DEATHMATCH,
            'winnerTeam' => $winnerTeam,
            'redScore' => $this->redScore,
            'blueScore' => $this->blueScore,
            'stats' => $playerStats
        ];
    }
}