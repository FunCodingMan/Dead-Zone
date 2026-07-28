<?php

namespace App\Site\app\repository;

use App\Site\app\model\User;

interface IPagesRender
{
    public function showForm(): void;
    public function showMenu(): void;
    public function showProfile(User $user): void;
    public function showModeSelection(): void;
    public function showSinglePlayer(): void;
    public function showFirstGame(): void;
    public function showSecondGame(): void;
    public function showSecondGameFinal(): void;
}