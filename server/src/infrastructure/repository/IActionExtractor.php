<?php

namespace App\infrastructure\repository;

interface IActionExtractor
{
    public function getAction(): string;


}