<?php

namespace App\Realtime\Application;

use App\Realtime\Infrastructure\WebSocketTransport;
use App\Site\app\repository\IUserRepository;

class MatchResultNotifier
{
    private WebSocketTransport $ws;
    private PlayerRegistry $registry;
    private IUserRepository $userRepository;

    public function __construct(WebSocketTransport $ws, PlayerRegistry $registry, IUserRepository $userRepository)
    {
        $this->ws = $ws;
        $this->registry = $registry;
        $this->userRepository = $userRepository;
    }

    public function notifyGameOver(array $disconnectedStats = []): void
    {
        $stats = [];
        $activePlayers = $this->registry->getPlayers();
        foreach ($activePlayers as $player) {
            $kills = $player->getKills() ?? 0;
            $deaths = $player->getDeaths() ?? 0;
            $this->userRepository->updateDataUser($player->getUserId(), $kills, $deaths, 1, 1);

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
            ];
        }

        $finalStats = array_merge($stats, $disconnectedStats);

        usort($finalStats, fn($a, $b) => $b['kd'] <=> $a['kd']);
        $packet = [
            'type' => 'game-over',
            'payload' => ['stats' => $finalStats],
        ];
        foreach ($activePlayers as $fd => $player) {
            $this->ws->send($fd, $packet);
        }
    }
}