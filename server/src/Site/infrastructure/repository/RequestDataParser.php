<?php

namespace App\Site\infrastructure\repository;

use App\Site\app\model\User;
use App\Site\app\repository\IRequestDataParser;
use RuntimeException;

class RequestDataParser implements IRequestDataParser
{
    public function getDataFromForm(): ?array
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

        $username = $data['username'];
        $length = strlen($username);

        if ($length < 4 || $length > 32) {
            http_response_code(400);
            throw new RuntimeException('Логин должен быть от 4 до 32 символов!');
        }

        if (!preg_match('/^[a-zA-Z0-9_-]+$/', $username)) {
            http_response_code(400);
            throw new RuntimeException('Логин должен содержать только латинские буквы, цифры, тире и нижнее подчеркивание');
        }

        if (preg_match('/^[_-]/', $username)) {
            http_response_code(400);
            throw new RuntimeException('Логин не может начинаться с тире или подчеркивания');
        }

        if (preg_match('/[_-]$/', $username)) {
            http_response_code(400);
            throw new RuntimeException('Логин не может заканчиваться тире или подчеркиванием');
        }

        if (preg_match('/[_-]{2,}/', $username)) {
            http_response_code(400);
            throw new RuntimeException('Логин не может содержать два спецсимвола подряд (например, "__" или "--")');
        }

        if (strlen($data['password']) < 6) {
            http_response_code(400);
            throw new RuntimeException("Пароль слишком маленький. Минимум 6 символов!");
        }

        return new User(trim($data['nickname']), $data['username'], $data['password']);
    }
}