<?php

require_once __DIR__ . '/../vendor/autoload.php';

use App\app\service\UserService;
use App\infrastructure\controller\UserController;
use App\infrastructure\repository\ActionExtractor;
use App\infrastructure\repository\ConnectionProvider;
use App\infrastructure\repository\PagesRender;
use App\infrastructure\repository\RequestDataParser;
use App\infrastructure\repository\UserTable;

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




