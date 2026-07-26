<?php

namespace App\Realtime\Application;

use App\Realtime\Infrastructure\WebSocketTransport;

class MatchResultNotifier
{
    private WebSocketTransport $ws;
    private PlayerRegistry $registry;

    public function __construct(WebSocketTransport $ws, PlayerRegistry $registry)
    {
        $this->ws = $ws;
        $this->registry = $registry;
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
            ];
        }

        //Сделать сохрание в БД

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