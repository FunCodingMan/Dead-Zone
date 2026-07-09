<?php
declare(strict_types=1);

namespace App\Controller;

use App\Model\ConnectionProvider;
use App\Model\RequestParser;
use App\Model\UserTable;
use JetBrains\PhpStorm\NoReturn; // TODO нужно посмотреть для чего и убрать

class UserController
{
    private UserTable $userTable;
    private RequestParser $requestParser;

    public function __construct()
    {
        $provider = new ConnectionProvider();
        $this->userTable = new UserTable($provider);
        $this->requestParser = new RequestParser();
    }

    public function Handler(): void
    {
        $response = $this->requestParser->getResponse();
        match ($response) {
            'save' => $this->addUser(),
            'show' => $this->showMenu(),
            'login' => $this->checkUser(),
            'logout' => $this->logoutMenu(),
            'mode-selection' => $this->playGame(),
            'profile' => $this->showProfile(),
            'singleplayer' => $this->showSingleplayer(),
            'training' => $this->openShowTraining(),
            default => $this->showForm()
        };
    }

    private function openShowTraining(): void
    {
        include_once __DIR__ . "/../View/training.html";
    }

    private function showSingleplayer(): void
    {
        include_once __DIR__ . "/../View/singleplayer.html";
    }

    private function showProfile(): void
    {
        include_once __DIR__ . "/../View/profile.html";
    }

    private function playGame(): void
    {
        include_once __DIR__ . "/../View/mode-selection.html";
    }

    #[NoReturn]
    private function checkUser(): void // пользователь не найден
    {
        $data = $this->requestParser->getDataFromLogin();
        $user = $this->userTable->getUserByUsername($data['username']);
        if ($user !== null && password_verify($data['password'], $user->getPassword())) {
            $redirectUrl = "/";
            $this->setTokenCookie($user->getToken());
            header('Content-Type: application/json');
            echo json_encode(['redirect' => $redirectUrl]);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Неверное имя пользователя или пароль']);
        }
        die();
    }

    #[NoReturn]
    private function addUser(): void  // пользователь может существовать
    {
        $user = $this->requestParser->getNewUserFromJson();

        try {
            $token = $this->userTable->saveUserToDatabase($user);
        } catch (\RuntimeException $error) {
            http_response_code(409);
            echo json_encode(['error' => $error->getMessage()]);
            die();
        }

        $redirectUrl = "/";
        $this->setTokenCookie($token);
        header('Content-Type: application/json');
        echo json_encode(['redirect' => $redirectUrl]);
        die();
    }

    private function showMenu(): void  // время токена вышло
    {
        $user = $this->userTable->getUserByToken($_COOKIE["token"]);
        if ($user) {
            include_once __DIR__ . "/../View/menu.html";
        } else {
            http_response_code(401);
            $this->showForm();
        }
    }

    private function showForm(): void
    {
        include_once __DIR__ . "/../View/form.html";
    }

    #[NoReturn]
    private function logoutMenu(): void
    {
        $this->deleteTokenCookie();
        $redirectUrl = "/";
        header('Content-Type: application/json');
        echo json_encode(['redirect' => $redirectUrl]);
        die();
    }

    private function setTokenCookie(string $token): void
    {
        setcookie('token', $token, [
            'expires' => time() + 60 * 60 * 24,
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
            'secure' => true,
        ]);
    }

    private function deleteTokenCookie(): void
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