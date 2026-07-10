<?php

namespace App\infrastructure\controller;

use App\infrastructure\repository\IActionExtractor;

class ActionExtractor implements IActionExtractor
{
    private const USER_LOGIN_URL = "/api/users/login";
    private const USER_SAVE_URL = "/api/users/save";
    private const USER_LOGOUT_URL = "/api/users/logout";
    private const USER_MODE_SELECTION_URL = "/mode-selection";
    private const USER_PROFILE_URL = "/profile";
    private const USER_SINGLEPLAYER_URL = '/mode-selection/singleplayer';
    private const USER_TRAINING_URL = '/mode-selection/singleplayer/training';


    public function getAction(): string
    {
        $request = $this->determineRequest();
        if ($request) {
            return $request;
        }
        return 'index';
    }

    private function determineRequest(): ?string
    {
        $url = $_SERVER["REQUEST_URI"];
        $method = $_SERVER["REQUEST_METHOD"];

        return match (true) {
            $method === "POST" && $url === self::USER_SAVE_URL => 'save',
            $method === "POST" && $url === self::USER_LOGIN_URL => 'login',
            $method === "POST" && $url === self::USER_LOGOUT_URL => 'logout',
            $method === "GET" && $url === self::USER_MODE_SELECTION_URL => 'mode-selection',
            $method === "GET" && $url === self::USER_PROFILE_URL => 'profile',
            $method === "GET" && $url === self::USER_SINGLEPLAYER_URL => 'singleplayer',
            $method === "GET" && $url === self::USER_TRAINING_URL => 'training',
            $method === "GET" && isset($_COOKIE["token"]) => 'show',
            default => null
        };
    }
}