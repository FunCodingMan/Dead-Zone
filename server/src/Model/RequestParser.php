<?php

namespace App\Model;

use RuntimeException;

class RequestParser
{
    private const USER_LOGIN_URL = "/api/users/login";
    private const USER_SAVE_URL = "/api/users/save";
    private const USER_LOGOUT_URL = "/api/users/logout";

    public function getDataFromLogin(): array
    {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        if (isset($data['username']) && isset($data['password'])) {
            return $data;
        } else {
            throw new RuntimeException('Invalid JSON from Login');
        }
    }

    public function getNewUserFromJson(): User
    {
        $requiredKeys = ['nickname', 'username', 'password'];
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        foreach ($requiredKeys as $key) {
            if (!isset($data[$key]) || $data[$key] === "") {
                http_response_code(400);
                throw new RuntimeException("{$key} was not specified");
            }
        }
        return new User($data['nickname'], $data['username'], $data['password']);
    }

    public function getResponse(): string
    {
        $request = $this->readRequest();
        if ($request) {
            return $request;
        }
        return 'index';
    }

    private function readRequest(): ?string
    {
        $url = $_SERVER["REQUEST_URI"];
        $method = $_SERVER["REQUEST_METHOD"];
        if ($method === "POST" && $url === self::USER_SAVE_URL) {
            return 'save';
        } else if ($method === "POST" && $url === self::USER_LOGIN_URL) {
            return 'login';
        } else if ($method === "POST" && $url === self::USER_LOGOUT_URL) {
            return 'logout';
        } else if ($method === "GET" && isset($_COOKIE["token"])) {
            return 'show';
        } else {
            return null;
        }
    }
}