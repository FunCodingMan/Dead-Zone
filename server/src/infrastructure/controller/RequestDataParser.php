<?php

namespace App\infrastructure\controller;

use App\app\model\User;
use App\infrastructure\repository\IRequestDataParser;
use RuntimeException;

class RequestDataParser implements IRequestDataParser
{
    public function getDataFromLogin(): ?array
    {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        if (isset($data['username']) && isset($data['password'])) {
            return $data;
        } else {
            return null;
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
}