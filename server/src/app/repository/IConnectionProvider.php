<?php

namespace App\app\repository;

use PDO;

interface IConnectionProvider
{
    public function connectDatabase(): PDO;
}