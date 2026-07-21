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
    public const int VISIBILITY_RADIUS = 800;
    public const float FOV_ANGLE = M_PI * 0.25;
    public const int RAY_STEP = 10;
    public const float SHOOT_COOLDOWN_S = 0.15;
    public const int DIFF_GUN_FORWARD = 1;
    public const int DIFF_GUN_SIDE = 5;
    public const int HEARING_RADIUS = 1500;
    public const int SPREAD_FACTOR = 10;
    public const bool IS_FOG_ACTIVE = true;
}