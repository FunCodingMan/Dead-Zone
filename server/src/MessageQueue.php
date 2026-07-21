<?php

namespace App;

class MessageQueue
{
    private const int MAX_QUEUE_SIZE_PER_FD = 5;
    private array $data;
    private array $countByFd;

    public function __construct()
    {
        $this->data = [];
        $this->countByFd = [];
    }

    public function enqueue(int $fd, string $type, array $payload): void
    {
        $this->countByFd[$fd] = ($this->countByFd[$fd] ?? 0) + 1;
        if ($this->countByFd[$fd] > self::MAX_QUEUE_SIZE_PER_FD) return;
        $data = ["fd" => $fd, "type" => $type, "payload" => $payload];
        $this->data[] = $data;
    }

    public function dequeueAll(): ?array
    {
        if (!empty($this->data)) {
            $tempData = $this->data;
            $this->data = [];
            $this->countByFd = [];
            return $tempData;
        }
        return null;
    }
}