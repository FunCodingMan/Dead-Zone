<?php

namespace App;

class MessageValidator
{
    public function isValidData(array $data): bool
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