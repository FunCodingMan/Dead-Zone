<?php

namespace App\Site\app\repository;

use App\Site\app\model\User;

interface IUserRepository
{
    public function saveUser(User $user): string;
    public function getUserByUsername(string $username): ?User;
    public function getUserByToken(string $token): ?User;
}