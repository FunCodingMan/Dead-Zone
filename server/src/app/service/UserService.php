<?php

namespace App\app\service;

use App\app\model\User;
use App\infrastructure\repository\IRequestDataParser;
use App\infrastructure\repository\IUserRepository;

class UserService
{
    private IUserRepository $userRepository;
    private IRequestDataParser $requestPayloadParser;

    public function __construct(IUserRepository $userRepository, IRequestDataParser $requestPayloadParser)
    {
        $this->userRepository = $userRepository;
        $this->requestPayloadParser = $requestPayloadParser;
    }

    public function registration(): string
    {
        $user = $this->requestPayloadParser->getNewUserFromJson();
        return $this->userRepository->saveUser($user);
    }

    public function login(): ?User
    {
        $data = $this->requestPayloadParser->getDataFromLogin();
        if (!$data) {
            return null;
        }

        $user = $this->userRepository->getUserByUsername($data['username']);
        if ($user !== null && password_verify($data['password'], $user->getPassword())) {
            return $user;
        }
        return null;
    }

    public function hasTokenInCookies(): bool
    {
        if (isset($_COOKIE["token"])) {
            $user = $this->userRepository->getUserByToken($_COOKIE["token"]);
            return (bool) $user;
        }
        return false;

    }

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


}