<?php

namespace App\Site\app\service;

use App\Site\app\model\User;
use App\Site\app\repository\IRequestDataParser;
use App\Site\app\repository\IUserRepository;

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

    public function getUser(): ?User
    {
        if (isset($_COOKIE["token"])) {
            return $this->userRepository->getUserByToken($_COOKIE["token"]);
        }
        return null;
    }

    public function getGlobalStats(): ?array
    {
        if (isset($_COOKIE["token"])) {
            $usersId = $this->userRepository->getLeaderboard();
            $stats = [];
            foreach ($usersId as $userId) {
                $user = $this->userRepository->getUserByUserId($userId);
                $stats[] = ['nickname' => $user->getNickname(), 'user_id' => $userId];
            }
            return $stats;
        }
        return null;
    }

    public function getGlobalUserById(string $userId): ?User
    {
        if (isset($_COOKIE["token"])) {
            return $this->userRepository->getUserByUserId($userId);
        }
        return null;
    }
}