<?php

namespace App\Realtime\Application;

use App\Realtime\Domain\Mode\GameModeInterface;
use App\Realtime\Infrastructure\WebSocketTransport;

class MatchResultNotifier
{
    private WebSocketTransport $ws;
    private PlayerRegistry $registry;
    private GameModeInterface $mode;

    public function __construct(WebSocketTransport $ws, PlayerRegistry $registry, GameModeInterface $mode)
    {
        $this->ws = $ws;
        $this->registry = $registry;
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

        //Сделать сохрание в БД

        $finalStats = array_merge($stats, $disconnectedStats);

        usort($finalStats, fn($a, $b) => $b['kd'] <=> $a['kd']);

        $payload = $this->mode->getGameOverPayload($finalStats);
        $packet = [
            'type' => 'game-over',
            'payload' => $payload,
        ];
        foreach ($activePlayers as $fd => $player) {
            $this->ws->send($fd, $packet);
        }
    }
}