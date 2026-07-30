<?php

namespace App\Site\app\repository;

use PDO;

interface IConnectionProvider
{
    public function connectDatabase(): PDO;
}