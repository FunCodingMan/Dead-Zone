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

    public function notifyGameOver(): void
    {
        $stats = [];
        foreach ($this->registry->getPlayers() as $player) {
            $stats[] = [
                'nickname' => $player->getNickname(),
                'kills' => $player->getKills(),
                'deaths' => $player->getDeaths(),
            ];
        }
        usort($stats, fn($a, $b) => $b['kills'] <=> $a['kills']);
        $packet = [
            'type' => 'game-over',
            'payload' => ['stats' => $stats],
        ];
        foreach ($this->registry->getPlayers() as $fd => $player) {
            $this->ws->send($fd, $packet);
        }
    }
}