<?php

namespace App\Realtime\Domain;

class LevelRepository
{
    private const array LEVELS = [
        'classic' => "
        ###########################################################
        #       #      #                       P                 P#
        #  P    #      #                     #############        #
        #       #      #                     #   BB     BB        #
        #  P                                     BB           B   #
        #                                    #BB   ########       #
        #      B#      #                     ####B #      #       #
        #       #  P   #                     #     #      #       #
        #       ########      #######        #     #      ####### #
        #  B B  #            #  P                          P      #
        #  B B  #     P#BBBB##BBBBB ##########     #B      #      #
        #       ########      #                     ########B     #
        #B B                  #        P                    B     #
        #B B  P #             #                      ####B        #
        #########             #                    #    ########  #
        #       ########     #######          BBBB##  B     #     #
        #       #      #           #    P     BBBB##    P    #    #
        #   B   #                                 ########   B    #
        #       #      #           #                         P B  #
        ####    #      ########B####B######B      #B         B    #
        # P#    #    P B      B#  #        #      #BB   ##        #
        #  #                          B    #  B B #     ##        #
        #  ##  ###B#####   B   #  #        #  ####     ###B#####  #
        #  # P    #           B#  #                 B         #   #
        #         #        B  B#  #                 B   B     # P #
        #         #  P BBBBBBBB#  #      P #       BBBBB  P   #   #
        ###########################################################",
        'classic_' => "
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