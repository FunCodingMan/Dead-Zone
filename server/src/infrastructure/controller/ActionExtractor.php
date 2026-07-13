<?php

namespace App\infrastructure\controller;

use App\infrastructure\repository\IActionExtractor;

class ActionExtractor implements IActionExtractor
{
    private const string USER_LOGIN_URL = "/api/users/login";
    private const string USER_REGISTRATION_URL = "/api/users/registration";
    private const string USER_LOGOUT_URL = "/api/users/logout";
    private const string USER_MODE_SELECTION_URL = "/mode-selection";
    private const string USER_PROFILE_URL = "/profile";
    private const string USER_SINGLEPLAYER_URL = '/mode-selection/singleplayer';
    private const string USER_TRAINING_URL = '/mode-selection/singleplayer/training';

    private const string USER_WAVES_URL = '/mode-selection/singleplayer/waves';


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
        $hasToken = isset($_COOKIE["token"]);

        return match (true) {
            $method === "POST" && $url === self::USER_REGISTRATION_URL => 'registration',
            $method === "POST" && $url === self::USER_LOGIN_URL => 'login',
            $method === "POST" && $url === self::USER_LOGOUT_URL && $hasToken => 'logout',
            $method === "GET" && $url === self::USER_MODE_SELECTION_URL && $hasToken => 'mode-selection',
            $method === "GET" && $url === self::USER_PROFILE_URL && $hasToken => 'profile',
            $method === "GET" && $url === self::USER_SINGLEPLAYER_URL && $hasToken => 'singleplayer',
            $method === "GET" && $url === self::USER_TRAINING_URL && $hasToken => 'training',
            $method === "GET" && $url === self::USER_WAVES_URL && $hasToken => 'waves',
            $method === "GET" && isset($_COOKIE["token"]) => 'menu',
            default => null
        };
    }
}