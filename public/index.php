<?php

require_once __DIR__ . '/../vendor/autoload.php';

use App\app\service\UserService;
use App\infrastructure\controller\ActionExtractor;
use App\infrastructure\controller\ConnectionProvider;
use App\infrastructure\controller\PagesController;
use App\infrastructure\controller\RequestDataParser;
use App\infrastructure\controller\UserController;
use App\infrastructure\controller\UserTable;

try {
    $connectionProvider = new ConnectionProvider();
    $userTable = new UserTable($connectionProvider);

    $requestDataParser = new RequestDataParser();
    $userService = new UserService($userTable, $requestDataParser);

    $actionExtractor = new ActionExtractor();
    $pagesController = new PagesController();

    $userController = new UserController($pagesController, $actionExtractor, $userService);
    $userController->executeAction();

} catch (RuntimeException $error) {
    echo $error->getMessage();
}




