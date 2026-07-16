<?php

namespace App\app\repository;

use App\app\model\User;

interface IUserRepository
{
    public function saveUser(User $user): string;
    public function getUserByUsername(string $username): ?User;
    public function getUserByToken(string $token): ?User;
}