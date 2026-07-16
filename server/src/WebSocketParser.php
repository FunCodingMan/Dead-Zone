<?php

namespace App;

class WebSocketParser
{
    private \Swoole\WebSocket\Server $server;
    private MessageValidator $validator;

    public function __construct(\Swoole\WebSocket\Server $server)
    {
        $this->server = $server;
        $this->validator = new MessageValidator();
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

        $payload = $arrData['payload'];
        $payload['type'] = $arrData['type'];

        if ($this->validator->isValidData($payload)) {
            return ["fd" => $fd, "data" => $payload];
        }

        return null;
    }

    public function sendStateGame(array $players): void
    {
        foreach ($players as $recipient) {
            $me = $recipient->getFullData();
            $others = [];
            foreach ($players as $player) {
                if ($recipient !== $player) {
                    $others["{$player->getUserId()}"] = $player->getPublicState();
                }
            }
            $data = [
                "type" => "state",
                "payload" => ["me" => $me, "others" => $others],
            ];
            $this->server->push($recipient->getFd(), json_encode($data));
        }
    }

}