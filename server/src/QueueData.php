<?php

namespace App;

class QueueData
{
    private array $data;

    public function __construct()
    {
        $this->data = [];
    }

    public function acceptNewStatePlayer(int $fd, array $payload): void
    {
        $data = ["fd" => $fd, "payload" => $payload];
        $this->data[] = $data;
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
}