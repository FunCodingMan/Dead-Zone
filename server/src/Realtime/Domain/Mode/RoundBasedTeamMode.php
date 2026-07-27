<?php
namespace App\Realtime\Domain\Mode;

use App\Realtime\Domain\Map\GameConfig;
use App\Realtime\Domain\Map\GameMap;
use App\Realtime\Domain\Model\Player;

class RoundBasedTeamMode implements GameModeInterface
{
    private int $redRoundWins = 0;
    private int $blueRoundWins = 0;
    private int $roundsToWin = 5;

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
        $symbol = $player->getTeam() === GameConfig::TEAM_RED
            ? GameConfig::SYMBOL_SPAWN_RED
            : GameConfig::SYMBOL_SPAWN_BLUE;

        return $map->findFreeSpawn($symbol);
    }

    public function canDamage(Player $attacker, Player $victim): bool
    {
        return $attacker->getTeam() !== $victim->getTeam();
    }

    public function handleKill(Player $killer, Player $victim): void
    {
        $killer->increaseKills();
        $victim->increaseDeaths();
    }

    public function isRespawnAllowed(): bool
    {
        return false;
    }

    public function isMatchOver(): bool
    {
        return $this->redRoundWins >= $this->roundsToWin || $this->blueRoundWins >= $this->roundsToWin;
    }

    public function getScores(): array
    {
        return ['red' => $this->redRoundWins, 'blue' => $this->blueRoundWins];
    }

    public function checkRoundState(array $players): ?string
    {
        $aliveRed = 0;
        $aliveBlue = 0;

        foreach ($players as $player) {
            if (!$player->isDead()) {
                if ($player->getTeam() === GameConfig::TEAM_RED) $aliveRed++;
                if ($player->getTeam() === GameConfig::TEAM_BLUE) $aliveBlue++;
            }
        }

        if ($aliveRed === 0 && $aliveBlue > 0) {
            $this->blueRoundWins++;
            return GameConfig::TEAM_BLUE;
        }

        if ($aliveBlue === 0 && $aliveRed > 0) {
            $this->redRoundWins++;
            return GameConfig::TEAM_RED;
        }

        if ($aliveRed === 0 && $aliveBlue === 0 && count($players) > 0) {
            return GameConfig::TEAM_NONE;
        }

        return null;
    }

    public function getGameOverPayload(array $playerStats): array
    {
        $winnerTeam = GameConfig::TEAM_NONE;
        if ($this->redRoundWins > $this->blueRoundWins) $winnerTeam = GameConfig::TEAM_RED;
        if ($this->blueRoundWins > $this->redRoundWins) $winnerTeam = GameConfig::TEAM_BLUE;

        return [
            'mode' => GameConfig::MODE_TEAM_DEATHMATCH,
            'winnerTeam' => $winnerTeam,
            'redScore' => $this->redRoundWins,
            'blueScore' => $this->blueRoundWins,
            'stats' => $playerStats
        ];
    }
}