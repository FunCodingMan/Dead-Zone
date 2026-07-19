<?php

namespace App;

class LevelRepository
{
    private const array LEVELS = [
        'classic' => "
        ################
        #P            P#
        #  ####  ####  #
        #  #        #  #
        #  ####  ####  #
        #P            P#
        ################",

        'open-field' => "
        ################
        #P             #
        #              #
        #             P#
        ################",
    ];

    public static function get(string $levelId): string
    {
        return self::LEVELS[$levelId] ?? self::LEVELS['classic'];
    }

    public static function getDefaultId(): string
    {
        return 'classic';
    }
}