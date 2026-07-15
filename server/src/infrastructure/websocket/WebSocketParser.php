<?php

namespace App\infrastructure\websocket;


class WebSocketParser
{
    private \Swoole\WebSocket\Server $server;
    private array $data;

    public function __construct(\Swoole\WebSocket\Server $server)
    {
        $this->server = $server;
        $this->data = [];
    }

    public function acceptNewStatePlayer(int $fd, string $json): void
    {
        $arrData = json_decode($json, true);
        if (!is_array($arrData)) {
            return;
        }
        //Надо расформировывать payload
        $payload = $arrData['payload'] ?? $arrData;
        $payload['type'] = $arrData['type'];

        if ($this->isValidData($payload)) {
            $data = ["fd" => $fd, "data" => $payload];
            $this->data[] = $data;
        }
    }

    public function transferData(): ?array
    {
        if (!empty($this->data)) {
            $tempData = $this->data;
            $this->data = [];
            return $tempData;
        }
        return null;
    }

    public function updateDataPlayers(array $players): void
    {
        foreach ($players as $recipient) {
            $me = $recipient->getFullData();
            $others = [];
            foreach ($players as $player) {
                if ($recipient !== $player) {
                    $others["{$player->getUser()->getUserId()}"] = $player->getPublicState();
                }
            }
            $data = [
                "type" => "state",
                "payload" => ["me" => $me, "others" => $others],
            ];
            $this->server->push($recipient->getFd(), json_encode($data));
        }
    }

    private function isValidData(array $data): bool
    {
        if (!isset($data["type"]) || !is_string($data["type"])) {
            return false;
        }

        return match ($data["type"]) {
            'move' => $this->isValidMove($data),
            default => false,
        };
    }

    private function isValidMove(array $data): bool
    {
        if (!isset($data["keys"], $data["angle"])) {
            return false;
        }

        if (!is_array($data["keys"]) || !is_numeric($data["angle"])) {
            return false;
        }

        if (count($data["keys"]) > 4 || count($data["keys"]) !== count(array_unique($data["keys"]))) {
            return false;
        }

        $allowedKeys = ['w', 's', 'd', 'a'];
        foreach ($data["keys"] as $index => $key) {
            if (!is_string($key) || !in_array($key, $allowedKeys, true)) {
                return false;
            }
        }

        return true;
    }
}