<?php

require_once __DIR__ . '/../vendor/autoload.php';

use App\Site\app\service\UserService;
use App\Site\infrastructure\controller\UserController;
use App\Site\infrastructure\repository\ActionExtractor;
use App\Site\infrastructure\repository\ConnectionProvider;
use App\Site\infrastructure\repository\PagesRender;
use App\Site\infrastructure\repository\RequestDataParser;
use App\Site\infrastructure\repository\UserTable;

try {
    $connectionProvider = new ConnectionProvider();
    $userTable = new UserTable($connectionProvider);

    $requestDataParser = new RequestDataParser();
    $userService = new UserService($userTable, $requestDataParser);

    $actionExtractor = new ActionExtractor();
    $pagesController = new PagesRender();

    $userController = new UserController($pagesController, $actionExtractor, $userService);
    $userController->executeAction();

} catch (RuntimeException $error) {
    echo $error->getMessage();
}




