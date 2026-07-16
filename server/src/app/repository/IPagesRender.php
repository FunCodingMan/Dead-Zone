<?php

namespace App\app\repository;

interface IPagesRender
{
    public function showForm(): void;
    public function showMenu(): void;
    public function showProfile(): void;
    public function showModeSelection(): void;
    public function showSinglePlayer(): void;
    public function showFirstGame(): void;
    public function showSecondGame(): void;
    public function showSecondGameFinal(): void;
}