<?php
declare(strict_types=1);

namespace App\infrastructure\controller;

use App\app\repository\IActionExtractor;
use App\app\repository\IExecuteAction;
use App\app\repository\IPagesRender;
use App\app\service\UserService;

class UserController implements IExecuteAction
{
    private IPagesRender $pagesRender;
    private IActionExtractor $requestParser;
    private UserService $userService;


    public function __construct(IPagesRender $pagesRender, IActionExtractor $requestParser, UserService $userService)
    {
        $this->pagesRender = $pagesRender;
        $this->requestParser = $requestParser;
        $this->userService = $userService;
    }

    public function executeAction(): void
    {
        $response = $this->requestParser->getAction();
        match ($response) {
            'registration' => $this->registrationUser(),
            'menu' => $this->showMenu(),
            'login' => $this->loginUser(),
            'logout' => $this->logoutUser(),
            'mode-selection' => $this->pagesRender->showModeSelection(),
            'profile' => $this->pagesRender->showProfile(),
            'singleplayer' => $this->pagesRender->showSinglePlayer(),
            'training' => $this->pagesRender->showFirstGame(),
            'waves' => $this->pagesRender->showSecondGame(),
            'waves-final' => $this->pagesRender->showSecondGameFinal(),
            'multiplayer' => $this->pagesRender->showMultiplayer(),
            'create-join-room' => $this->pagesRender->showCreateRoom(),
            'join-room' => $this->pagesRender->showJoinRoom(),
            default => $this->pagesRender->showForm(),
        };
    }

    private function registrationUser(): void
    {
        try {
            $token = $this->userService->registration();
        } catch (\RuntimeException $error) {
            http_response_code(409);
            echo json_encode(['error' => $error->getMessage()]);
            die();
        }
        $redirectUrl = "/";
        $this->requestParser->setTokenCookie($token);
        header('Content-Type: application/json');
        echo json_encode(['redirect' => $redirectUrl]);
        die();
    }

    private function loginUser(): void
    {
        $user = $this->userService->login();
        if ($user) {
            $redirectUrl = "/";
            $this->requestParser->setTokenCookie($user->getToken());
            header('Content-Type: application/json');
            echo json_encode(['redirect' => $redirectUrl]);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Неверное имя пользователя или пароль']);
        }
        die();
    }

    private function logoutUser(): void
    {
        $this->requestParser->deleteTokenCookie();
        $redirectUrl = "/";
        header('Content-Type: application/json');
        echo json_encode(['redirect' => $redirectUrl]);
        die();
    }

    private function showMenu(): void  // время токена вышло
    {
        if ($this->userService->hasTokenInCookies()) {
            $this->pagesRender->showMenu();
        } else {
            http_response_code(401);
            $this->pagesRender->showForm();
        }
    }
}