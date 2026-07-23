<?php


namespace App\Realtime\Domain\Map;

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
    public const float RELOAD_TIME_S = 2.0;
    public const int MAX_BULLETS = 50;
    public const int HP_SIZE = 100;
    public const float RESPAWN_TIME_S = 5.0;
    public const float MATCH_DURATION_S = 60_0;
    public const int MAX_COUNT_USERS = 15;
    public const int RADIUS_OF_CLOSE_OBSERVE = 200;
    public const int MAX_HEALTH_PLAYER = 100;
    public const float SPREAD_RECOVERY_TIME_S = 0.4;
}