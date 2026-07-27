<?php

namespace App\Realtime\Application;

use App\Realtime\Domain\Map\GameConfig;
use App\Realtime\Domain\Mode\GameModeInterface;
use App\Realtime\Infrastructure\WebSocketTransport;
use App\Site\app\repository\IUserRepository;

class MatchResultNotifier
{
    private WebSocketTransport $ws;
    private PlayerRegistry $registry;
    private IUserRepository $userRepository;
    private GameModeInterface $mode;

    public function __construct(WebSocketTransport $ws, PlayerRegistry $registry, IUserRepository $userRepository, GameModeInterface $mode)
    {
        $this->ws = $ws;
        $this->registry = $registry;
        $this->userRepository = $userRepository;
        $this->mode = $mode;
    }

    public function setMode(GameModeInterface $mode): void
    {
        $this->mode = $mode;
    }

    public function notifyGameOver(array $disconnectedStats = []): void
    {
        $stats = [];
        $activePlayers = $this->registry->getPlayers();

        foreach ($activePlayers as $player) {
            $kills = $player->getKills() ?? 0;
            $deaths = $player->getDeaths() ?? 0;

            if ($deaths === 0) {
                $kd = $kills;
            } else {
                $kd = $kills / $deaths;
            }

            $kdFormatted = number_format($kd, 2, '.', '');
            $stats[] = [
                'nickname' => $player->getNickname(),
                'kills' => $kills,
                'deaths' => $deaths,
                'kd' => $kdFormatted,
                'team' => $player->getTeam()
            ];
        }

        $finalStats = array_merge($stats, $disconnectedStats);

        usort($finalStats, fn($a, $b) => $b['kd'] <=> $a['kd']);

        $payload = $this->mode->getGameOverPayload($finalStats);

        foreach ($activePlayers as $player) {
            $isWinner = false;

            if (isset($payload['winnerTeam']) && $payload['winnerTeam'] !== GameConfig::TEAM_NONE) {
                $isWinner = $player->getTeam() === $payload['winnerTeam'];
            } elseif (isset($payload['winner'])) {
                $isWinner = $player->getNickname() === $payload['winner'];
            }

            $wins = $isWinner ? 1 : 0;
            $loses = $isWinner ? 0 : 1;

            $this->userRepository->updateDataUser(
                $player->getUserId(),
                $player->getKills() ?? 0,
                $player->getDeaths() ?? 0,
                $wins,
                $loses
            );
        }

        $packet = [
            'type' => 'game-over',
            'payload' => $payload,
        ];

        foreach ($activePlayers as $fd => $player) {
            $this->ws->send($fd, $packet);
        }
    }
}