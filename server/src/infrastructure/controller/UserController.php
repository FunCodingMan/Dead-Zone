<?php
declare(strict_types=1);

namespace App\infrastructure\controller;

use App\app\service\UserService;
use App\infrastructure\repository\IActionExtractor;
use App\infrastructure\repository\IExecuteAction;
use App\infrastructure\repository\IPagesRender;

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
        $this->userService->setTokenCookie($token);
        header('Content-Type: application/json');
        echo json_encode(['redirect' => $redirectUrl]);
        die();
    }

    private function loginUser(): void
    {
        $user = $this->userService->login();
        if ($user) {
            $redirectUrl = "/";
            $this->userService->setTokenCookie($user->getToken());
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
        $this->userService->deleteTokenCookie();
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