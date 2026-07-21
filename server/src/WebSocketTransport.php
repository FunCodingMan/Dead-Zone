<?php

namespace App;

class WebSocketTransport
{
    private \Swoole\WebSocket\Server $server;
    private MessageValidator $validator;

    public function __construct(\Swoole\WebSocket\Server $server, MessageValidator $validator)
    {
        $this->server = $server;
        $this->validator = $validator;
    }

    public function parse(int $fd, string $json): ?array
    {
        $arrData = json_decode($json, true);
        if (!is_array($arrData)) {
            return null;
        }

        if (!isset($arrData['type']) || !is_string($arrData['type'])) {
            return null;
        }

        if (!isset($arrData['payload']) || !is_array($arrData['payload'])) {
            return null;
        }

        $type = $arrData['type'];
        $payload = $arrData['payload'];

        if ($this->validator->isValidData($type, $payload)) {
            return ["fd" => $fd, "type" => $type, "payload" => $payload];
        }

        return null;
    }

    public function broadcastGameState(array $visiblePlayersData, float $timeLeft): void
    {
        foreach ($visiblePlayersData as $fd => $data) {
            $me = $data["me"]->getFullData();
            $others = [];
            foreach ($data["others"] as $otherPlayer) {
                $others[$otherPlayer->getUserId()] = $otherPlayer->getPublicState();
            }
            $packet = [
                "type" => 'state',
                "payload" => ["me" => $me, "others" => $others, 'timeLeft' => $timeLeft],
            ];
            $this->send($fd, $packet);
        }
    }

    public function send(int $fd, array $data): void
    {
        $this->server->push($fd, json_encode($data));
    }

}