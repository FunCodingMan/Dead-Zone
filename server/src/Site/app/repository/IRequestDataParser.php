<?php

namespace App\Site\app\repository;

use App\Site\app\model\User;

interface IRequestDataParser
{
    public function getNewUserFromJson(): User;
    public function getDataFromLogin(): ?array;
}