<?php

namespace App\Site\infrastructure\repository;

use App\Site\app\model\User;
use App\Site\app\repository\IRequestDataParser;
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
        $requiredKeys = [
            'nickname' => 'Введите имя пользователя!',
            'username' => 'Введите логин пользователя!',
            'password' => 'Введите пароль!'
        ];
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);

        foreach ($requiredKeys as $key => $errorMessage) {
            if (empty($data[$key])) {
                http_response_code(400);
                throw new RuntimeException($errorMessage);
            }
        }

        $usernamePattern = '/^[a-zA-Z0-9]([a-zA-Z0-9_-]*[a-zA-Z0-9])?$/';
        if (!preg_match($usernamePattern, $data['username']) || strlen($data['username']) < 4) {
            http_response_code(400);
            throw new RuntimeException('Логин пользователя не действителен');
        }

        if (strlen($data['password']) < 6) {
            http_response_code(400);
            throw new RuntimeException("Пароль слишком маленький. Миним 6 символов!");
        }

        return new User(trim($data['nickname']), $data['username'], $data['password']);
    }
}