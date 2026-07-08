<?php

require_once __DIR__ . '/../vendor/autoload.php';

use App\Controller\UserController;

try {
    $userController = new UserController();
    $userController->Handler();
} catch (RuntimeException $error) {
    echo $error->getMessage();
}




