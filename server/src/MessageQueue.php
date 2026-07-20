<?php

namespace App;

class MessageQueue
{
    private array $data;

    public function __construct()
    {
        $this->data = [];
    }

    public function enqueue(int $fd, string $type, array $payload): void
    {
        $data = ["fd" => $fd, "type" => $type, "payload" => $payload];
        $this->data[] = $data;
    }

    public function dequeueAll(): ?array
    {
        if (!empty($this->data)) {
            $tempData = $this->data;
            $this->data = [];
            return $tempData;
        }
        return null;
    }
}