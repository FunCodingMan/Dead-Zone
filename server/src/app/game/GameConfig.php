<?php


namespace App\app\game;

class GameConfig
{
    public const int CELL_SIZE = 64;

    public const int PLAYER_WIDTH = 28;
    public const int PLAYER_HEIGHT = 48;
    public const int HITBOX_SIZE = 28;
    public const float PLAYER_SPEED = 8.0;

    public const string SYMBOL_WALL = '#';
    public const string SYMBOL_BOX = 'B';
    public const string SYMBOL_PLAYER = 'P';
    public const string SYMBOL_ENEMY = 'E';
    public const string SYMBOL_TARGET = 'T';
}