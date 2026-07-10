<?php

namespace App\infrastructure\repository;

use PDO;

interface IConnectionProvider
{
    public function connectDatabase(): PDO;
}