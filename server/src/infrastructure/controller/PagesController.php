<?php

namespace App\infrastructure\controller;

use App\infrastructure\repository\IPagesRender;

class PagesController implements IPagesRender
{

    public function showForm(): void
    {
        include_once __DIR__ . "/../../View/form.html";
    }

    public function showMenu(): void
    {
        include_once __DIR__ . "/../../View/menu.html";
    }

    public function showProfile(): void
    {
        include_once __DIR__ . "/../../View/profile.html";
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
}