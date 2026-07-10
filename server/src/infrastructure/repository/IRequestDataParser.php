<?php

namespace App\infrastructure\repository;

use App\app\model\User;

interface IRequestDataParser
{
    public function getNewUserFromJson(): User;
    public function getDataFromLogin(): ?array;
}