<?php

namespace App\Site\infrastructure\repository;

use App\Site\app\model\User;
use App\Site\app\repository\IPagesRender;

class PagesRender implements IPagesRender
{

    public function showForm(): void
    {
        include_once __DIR__ . "/../../View/form.html";
    }

    public function showMenu(): void
    {
        include_once __DIR__ . "/../../View/menu.html";
    }

    public function showProfile(User $user): void
    {
        include_once __DIR__ . "/../../View/profile.php";
    }

    public function showModeSelection(): void
    {
        include_once __DIR__ . "/../../View/mode-selection.html";
    }

    public function showSinglePlayer(): void
    {
        include_once __DIR__ . "/../../View/singleplayer.html";
    }

    public function showFirstGame(): void
    {
        include_once __DIR__ . "/../../View/training.html";
    }

    public function showSecondGame(): void
    {
        include_once __DIR__ . "/../../View/waves.html";
    }

    public function showSecondGameFinal(): void
    {
        include_once __DIR__ . "/../../View/finalScreen.html";
    }

    public function showMultiplayer(): void
    {
        include_once __DIR__ . "/../../View/multiplayer.html";
    }

    public function showGlobalStats(array $stats): void
    {
        include_once __DIR__ . "/../../View/global-stats.php";
    }

    public function showPublicProfile(User $user): void
    {
        include_once __DIR__ . "/../../View/publicProfile.php";
    }

    public function showProfileNotFound(): void
    {
        include_once __DIR__ . "/../../View/profileNotFound.html";
    }
}