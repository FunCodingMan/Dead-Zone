<?php

namespace App;

class MessageValidator
{
    public function isValidData(string $type, array $data): bool
    {
        return match ($type) {
            'move' => $this->isValidMove($data),
            'create-room' => $this->isValidCreateRoom($data),
            'join-room' => $this->isValidJoinRoom($data),
            'exit-room' => $this->isValidExitRoom($data),
            'ready' => $this->isValidReady($data),
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

    private function isValidReady(array $data): bool
    {
        if (!isset($data['isReady']) || !is_bool($data['isReady'])) {
            return false;
        }
        return true;
    }

    private function isValidJoinRoom(array $data): bool
    {
        if (!isset($data['roomId']) || !is_string($data['roomId'])) {
            return false;
        }
        return true;
    }

    private function isValidExitRoom(array $data): bool
    {
        return empty($data);
    }

        private function isValidCreateRoom(array $data): bool
    {
        return empty($data);
    }
}