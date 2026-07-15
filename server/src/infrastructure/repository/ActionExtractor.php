<?php

namespace App\infrastructure\repository;

use App\app\repository\IActionExtractor;

class ActionExtractor implements IActionExtractor
{
    private const USER_LOGIN_URL = "/api/users/login";
    private const USER_REGISTRATION_URL = "/api/users/registration";
    private const USER_LOGOUT_URL = "/api/users/logout";
    private const USER_MODE_SELECTION_URL = "/mode-selection";
    private const USER_PROFILE_URL = "/profile";
    private const USER_SINGLEPLAYER_URL = '/mode-selection/singleplayer';
    private const USER_TRAINING_URL = '/mode-selection/singleplayer/training';

    private const string USER_WAVES_URL = '/mode-selection/singleplayer/waves';
    private const string USER_WAVES_FINAL_URL = '/mode-selection/singleplayer/waves-final';

    private const string USER_MULTIPLAYER_URL = '/mode-selection/multiplayer';

    public function setTokenCookie(string $token): void
    {
        setcookie('token', $token, [
            'expires' => time() + 60 * 60 * 24,
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
            'secure' => true,
        ]);
    }

    public function deleteTokenCookie(): void
    {
        setcookie('token', '', [
            'expires' => time() - 3600,
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
            'secure' => true,
        ]);
    }

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

        $urlPath = strtok($url, '?');

        return match (true) {
            $method === "POST" && $url === self::USER_REGISTRATION_URL => 'registration',
            $method === "POST" && $url === self::USER_LOGIN_URL => 'login',
            $method === "POST" && $url === self::USER_LOGOUT_URL && $hasToken => 'logout',
            $method === "GET" && $urlPath === self::USER_MODE_SELECTION_URL && $hasToken => 'mode-selection',
            $method === "GET" && $urlPath === self::USER_PROFILE_URL && $hasToken => 'profile',
            $method === "GET" && $urlPath === self::USER_SINGLEPLAYER_URL && $hasToken => 'singleplayer',
            $method === "GET" && $urlPath === self::USER_TRAINING_URL && $hasToken => 'training',
            $method === "GET" && $urlPath === self::USER_WAVES_URL && $hasToken => 'waves',
            $method === "GET" && $urlPath === self::USER_WAVES_FINAL_URL && $hasToken => 'waves-final',
            $method === "GET" && $urlPath === self::USER_MULTIPLAYER_URL && $hasToken => 'multiplayer',
            $method === "GET" && isset($_COOKIE["token"]) => 'menu',
            default => null
        };
    }
}