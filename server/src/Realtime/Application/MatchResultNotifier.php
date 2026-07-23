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
            $stats[] = [
                'nickname' => $player->getNickname(),
                'kills' => $player->getKills(),
                'deaths' => $player->getDeaths(),
            ];
        }
        $finalStats = array_merge($stats, $disconnectedStats);

        usort($finalStats, fn($a, $b) => $b['kills'] <=> $a['kills']);
        $packet = [
            'type' => 'game-over',
            'payload' => ['stats' => $finalStats],
        ];
        foreach ($activePlayers as $fd => $player) {
            $this->ws->send($fd, $packet);
        }
    }
}