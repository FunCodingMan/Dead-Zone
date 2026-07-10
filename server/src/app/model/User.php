<?php

namespace App\app\model;

class User
{
    private Stats $stats;
    private ?string $user_id;
    private string $nickname;
    private string $username;
    private string $password;
    private ?string $token;

    public function __construct(string $nickname, string $username, string $password, ?string $user_id = null, ?string $token = null, ?Stats $stats = null)
    {
        $this->nickname = $nickname;
        $this->username = $username;
        $this->password = $password;
        $this->user_id = $user_id;
        $this->token = $token;
        $this->stats = $stats ?? new Stats();
    }

    public function getUsername(): string
    {
        return $this->username;
    }

    public function getNickname(): string
    {
        return $this->nickname;
    }

    public function getPassword(): string
    {
        return $this->password;
    }

    public function getStats(): Stats
    {
        return $this->stats;
    }

    public function getUserId(): ?string
    {
        return $this->user_id;
    }

    public function getToken(): ?string
    {
        return $this->token;
    }

}